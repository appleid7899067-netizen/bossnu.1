import { useMemo } from "react";

const WORLDVIEW =
  "https://worldview.earthdata.nasa.gov/?lg=true&l=Reference_Labels_15m%2CReference_Features_15m%28hidden%29%2CCoastlines_15m%2CMODIS_Combined_Flood_3-Day%28disabled%3D4%29%2CMODIS_Combined_Flood_2-Day%28disabled%3D4%29%2CVIIRS_NOAA21_CorrectedReflectance_TrueColor%28hidden%29%2CVIIRS_NOAA20_CorrectedReflectance_TrueColor%28hidden%29%2CVIIRS_SNPP_CorrectedReflectance_TrueColor%28hidden%29%2CMODIS_Aqua_CorrectedReflectance_TrueColor%2CMODIS_Terra_CorrectedReflectance_TrueColor&v=97%2C5%2C106%2C21";

export function SatelliteMapView() {
  const loadedAt = useMemo(() => new Date().toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }), []);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-bg">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">🛰️</div>
        <div className="min-w-0">
          <h1 className="text-sm font-medium">Satellite / Live Map</h1>
          <p className="text-[10px] text-subtle">NASA Worldview • ภาพดาวเทียมและชั้นน้ำท่วมแบบ near-real-time</p>
        </div>
        <span className="ml-auto rounded-full border border-primary/20 bg-primary/5 px-2 py-1 text-[9px] font-medium text-primary">LIVE DATA</span>
      </header>

      <div className="min-h-0 flex-1 p-3">
        <div className="relative h-full min-h-[520px] overflow-hidden rounded-2xl border border-border bg-clay/30">
          <iframe
            title="NASA Worldview Thailand satellite flood map"
            src={WORLDVIEW}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border px-4 py-2 text-[9px] text-subtle">
        <span>🟢 แหล่งข้อมูล: NASA Worldview / GIBS</span>
        <span>•</span>
        <span>Flood 2-Day / 3-Day + True Color</span>
        <span>•</span>
        <span>เปิดหน้า: {loadedAt}</span>
        <span className="basis-full sm:basis-auto sm:ml-auto">หมายเหตุ: satellite imagery เป็น near-real-time ไม่ใช่ภาพสดทุกวินาที</span>
      </footer>
    </section>
  );
}
