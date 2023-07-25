import { Injectable } from '@angular/core';
import { IMeasurement, MeasurementService, Realtime } from '@c8y/client';
import { Subject } from 'rxjs';
import { IndoorAirQualityLevel } from './iaq.model';
import { has, get } from 'lodash';

@Injectable()
export class IndoorAirQualityWidgetService {
  private readonly AIR_QUALITY_LEVELS: IndoorAirQualityLevel[] = [
    {
      label: 'air-quality.excellent.label',
      recommendation: 'air-quality.excellent.recommendation',
      threshold: {
        min: 0,
        max: 50,
      },
      cssColor: '#00E400',
    },
    {
      label: 'air-quality.good.label',
      recommendation: 'air-quality.good.recommendation',
      threshold: {
        min: 51,
        max: 100,
      },
      cssColor: '#92D050',
    },
    {
      label: 'air-quality.lightly-polluted.label',
      recommendation: 'air-quality.lightly-polluted.recommendation',
      threshold: {
        min: 101,
        max: 150,
      },
      cssColor: '#C9C900',
    },
    {
      label: 'air-quality.moderately-polluted.label',
      recommendation: 'air-quality.moderately-polluted.recommendation',
      threshold: {
        min: 151,
        max: 200,
      },
      cssColor: '#FF7E00',
    },
    {
      label: 'air-quality.heavily-polluted.label',
      recommendation: 'air-quality.heavily-polluted.recommendation',
      threshold: {
        min: 201,
        max: 250,
      },
      cssColor: '#FF0000',
    },
    {
      label: 'air-quality.severely-polluted.label',
      recommendation: 'air-quality.severely-polluted.recommendation',
      threshold: {
        min: 251,
        max: 350,
      },
      cssColor: '#99004C',
    },
    {
      label: 'air-quality.extremely-polluted.label',
      recommendation: 'air-quality.extremely-polluted.recommendation',
      threshold: {
        min: 351,
        max: 500,
      },
      cssColor: '#663300',
    },
  ];

  public indoorAirQuality$: Subject<IndoorAirQualityLevel & { value: number }> = new Subject<
    IndoorAirQualityLevel & { value: number }
  >();

  constructor(private measurementService: MeasurementService, private realtime: Realtime) {}

  init(deviceId: string, measurementFragment: string, measurementSeries: string) {
    this.loadLatestMeasurement(deviceId, measurementFragment, measurementSeries);
    this.subscribeForMeasurements(deviceId, measurementFragment, measurementSeries);
  }

  private loadLatestMeasurement(
    deviceId: string,
    measurementFragment: string,
    measurementSeries: string
  ) {
    const filter = {
      source: deviceId,
      dateFrom: '1970-01-01',
      dateTo: new Date().toISOString(),
      valueFragmentType: measurementFragment,
      valueFragmentSeries: measurementSeries,
      pageSize: 1,
      revert: true,
    };

    this.measurementService.list(filter).then((response) => {
      if (
        !response.data ||
        response.data.length != 1 ||
        !has(response.data[0], `${measurementFragment}.${measurementSeries}`)
      ) {
        return;
      }

      const indoorAirQualityValue: number = get(
        response.data[0],
        `${measurementFragment}.${measurementSeries}.value`
      );
      this.updateIndoorAirQualityLevel(indoorAirQualityValue);
    });
  }

  private subscribeForMeasurements(
    deviceId: string,
    measurementFragment: string,
    measurementSeries: string
  ) {
    this.realtime.subscribe(`/measurements/${deviceId}`, (measurementNotification) => {
      const measurement: IMeasurement = measurementNotification.data.data;
      if (!measurement || !has(measurement, `${measurementFragment}.${measurementSeries}`)) {
        return;
      }

      const indoorAirQualityValue: number = get(
        measurement,
        `${measurementFragment}.${measurementSeries}.value`
      );
      this.updateIndoorAirQualityLevel(indoorAirQualityValue);
    });
  }

  private updateIndoorAirQualityLevel(indoorAirQualityValue: number) {
    const indoorAirQualityLevel: IndoorAirQualityLevel = this.AIR_QUALITY_LEVELS.find(
      (airQualityLevel) =>
        indoorAirQualityValue >= airQualityLevel.threshold.min &&
        indoorAirQualityValue <= airQualityLevel.threshold.max
    );

    if (!indoorAirQualityLevel) {
      return;
    }

    this.indoorAirQuality$.next({ ...indoorAirQualityLevel, ...{ value: indoorAirQualityValue } });
  }
}
