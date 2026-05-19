import type {
  ISeriesPrimitive,
  IPrimitivePaneView,
  IPrimitivePaneRenderer,
  SeriesAttachedParameter,
  ISeriesApi,
  IChartApiBase,
  SeriesType,
  Time,
  UTCTimestamp,
} from 'lightweight-charts'
import type { CanvasRenderingTarget2D } from 'fancy-canvas'
import type { FVG } from './volumeProfile'

class FVGRenderer implements IPrimitivePaneRenderer {
  constructor(
    private readonly _fvgs: FVG[],
    private readonly _series: ISeriesApi<SeriesType, Time>,
    private readonly _chart: IChartApiBase<Time>,
    private readonly _lastBarTime: number
  ) {}

  draw(target: CanvasRenderingTarget2D): void {
    target.useBitmapCoordinateSpace(({ context: ctx, horizontalPixelRatio: hpr, verticalPixelRatio: vpr }) => {
      for (const fvg of this._fvgs) {
        const y1 = this._series.priceToCoordinate(fvg.topPrice)
        const y2 = this._series.priceToCoordinate(fvg.bottomPrice)
        const x1 = this._chart.timeScale().timeToCoordinate(fvg.startTime as UTCTimestamp)
        const x2 = this._chart.timeScale().timeToCoordinate(this._lastBarTime as UTCTimestamp)

        if (y1 === null || y2 === null || x1 === null) continue

        const rx = x1 * hpr
        const ry = Math.min(y1, y2) * vpr
        const rh = Math.abs(y2 - y1) * vpr
        const rw = x2 !== null ? Math.max((x2 - x1) * hpr, 20 * hpr) : 9999

        ctx.fillStyle = fvg.type === 'bullish' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'
        ctx.strokeStyle = fvg.type === 'bullish' ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'
        ctx.lineWidth = 1
        ctx.fillRect(rx, ry, rw, rh)
        ctx.strokeRect(rx, ry, rw, rh)
      }
    })
  }
}

class FVGPaneView implements IPrimitivePaneView {
  constructor(
    private readonly _fvgs: FVG[],
    private readonly _series: ISeriesApi<SeriesType, Time>,
    private readonly _chart: IChartApiBase<Time>,
    private readonly _lastBarTime: number
  ) {}

  renderer(): FVGRenderer {
    return new FVGRenderer(this._fvgs, this._series, this._chart, this._lastBarTime)
  }
}

export class FVGPrimitive implements ISeriesPrimitive<Time> {
  private _fvgs: FVG[] = []
  private _chart: IChartApiBase<Time> | null = null
  private _series: ISeriesApi<SeriesType, Time> | null = null
  private _requestUpdate: (() => void) | null = null
  private _lastBarTime = 0

  attached(param: SeriesAttachedParameter<Time>): void {
    this._chart = param.chart
    this._series = param.series as ISeriesApi<SeriesType, Time>
    this._requestUpdate = param.requestUpdate
  }

  detached(): void {
    this._chart = null
    this._series = null
    this._requestUpdate = null
  }

  updateData(fvgs: FVG[], lastBarTime: number): void {
    this._fvgs = fvgs
    this._lastBarTime = lastBarTime
    this._requestUpdate?.()
  }

  paneViews(): readonly IPrimitivePaneView[] {
    if (!this._series || !this._chart) return []
    return [new FVGPaneView(this._fvgs, this._series, this._chart, this._lastBarTime)]
  }
}
