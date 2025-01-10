import { IChartApi, MouseEventParams, Time, SeriesType, ISeriesApi, LineStyle } from 'lightweight-charts';

interface Point {
  time: Time;
  price: number;
}

export class RectangleDrawingPlugin {
  private chart: IChartApi;
  private isDrawing: boolean = false;
  private startPoint: Point | null = null;
  private rectangleSeries: ISeriesApi<"Line"> | null = null;

  constructor(chart: IChartApi) {
    this.chart = chart;
    this.chart.subscribeClick(this.handleClick);
    this.chart.subscribeCrosshairMove(this.handleMouseMove);
  }

  private handleClick = (param: MouseEventParams) => {
    if (!param.point || !param.time) return;

    if (!this.isDrawing) {
      this.startDrawing(param);
    } else {
      this.finishDrawing(param);
    }
  };

  private handleMouseMove = (param: MouseEventParams) => {
    if (this.isDrawing && this.startPoint && param.point && param.time) {
      this.updateRectangle(param);
    }
  };

  private startDrawing(param: MouseEventParams) {
    if (!param.point || !param.time) return;
    this.isDrawing = true;
    this.startPoint = { time: param.time, price: param.point.price };

    this.rectangleSeries = this.chart.addLineSeries({
      color: 'rgba(76, 175, 80, 1)',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      lastPriceAnimation: 0,
    });
  }

  private updateRectangle(param: MouseEventParams) {
    if (!this.startPoint || !param.point || !param.time || !this.rectangleSeries) return;
    const endPoint = { time: param.time, price: param.point.price };

    const minTime = Math.min(this.startPoint.time as number, endPoint.time as number);
    const maxTime = Math.max(this.startPoint.time as number, endPoint.time as number);
    const minPrice = Math.min(this.startPoint.price, endPoint.price);
    const maxPrice = Math.max(this.startPoint.price, endPoint.price);

    this.rectangleSeries.setData([
      { time: minTime, value: minPrice },
      { time: minTime, value: maxPrice },
      { time: maxTime, value: maxPrice },
      { time: maxTime, value: minPrice },
      { time: minTime, value: minPrice },
    ]);
  }

  private finishDrawing(param: MouseEventParams) {
    if (!param.point || !param.time) return;
    this.isDrawing = false;
    this.startPoint = null;
  }

  public startDrawingMode() {
    this.isDrawing = false;
    this.startPoint = null;
    this.removeCurrentRectangle();
  }

  public stopDrawingMode() {
    this.isDrawing = false;
    this.startPoint = null;
    this.removeCurrentRectangle();
  }

  private removeCurrentRectangle() {
    if (this.rectangleSeries) {
      this.chart.removeSeries(this.rectangleSeries);
      this.rectangleSeries = null;
    }
  }

  public isDrawingMode(): boolean {
    return this.isDrawing;
  }
}

