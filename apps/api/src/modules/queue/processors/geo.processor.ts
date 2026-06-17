import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { QUEUES, GEO_JOBS } from '../queue.constants';

interface ReverseGeocodeJobData {
  scanEventId: string;
  latitude: number;
  longitude: number;
}

@Processor(QUEUES.GEO, { concurrency: 5 })
export class GeoProcessor extends WorkerHost {
  private readonly logger = new Logger(GeoProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case GEO_JOBS.REVERSE_GEOCODE:
        return this.handleReverseGeocode(job.data as ReverseGeocodeJobData);
      default:
        this.logger.warn(`Unknown geo job: ${job.name}`);
    }
  }

  private async handleReverseGeocode(data: ReverseGeocodeJobData) {
    const { scanEventId, latitude, longitude } = data;

    const { city, country } = await this.reverseGeocode(latitude, longitude);

    if (city || country) {
      await this.prisma.scanEvent.update({
        where: { id: scanEventId },
        data: { city, country },
      });
    }
  }

  /**
   * Reverse geocode using Nominatim (free, no API key).
   * In production, swap for Google Maps Geocoding API or Mapbox for SLA guarantees.
   */
  private async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<{ city: string | null; country: string | null }> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'PetID/1.0 (noreply@petid.app)' },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) return { city: null, country: null };

      const json = (await res.json()) as {
        address?: {
          city?: string;
          town?: string;
          village?: string;
          country?: string;
        };
      };

      const city =
        json.address?.city ??
        json.address?.town ??
        json.address?.village ??
        null;
      const country = json.address?.country ?? null;

      return { city, country };
    } catch (err) {
      this.logger.warn(`Reverse geocode failed for (${lat}, ${lng}): ${(err as Error).message}`);
      return { city: null, country: null };
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Geo job ${job.name} [${job.id}] failed: ${error.message}`);
  }
}
