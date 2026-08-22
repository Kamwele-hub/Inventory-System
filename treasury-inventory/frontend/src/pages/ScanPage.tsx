import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { api } from "../api/client";
import { ItemListRow, CursorPage } from "../types/inventory";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [manualTag, setManualTag] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let cancelled = false;

    async function start() {
      try {
        setScanning(true);
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
          if (result && !cancelled) {
            handleTagFound(result.getText());
          }
        });
        controlsRef.current = controls;
      } catch {
        setError("Could not access the camera. Enter the asset tag manually below.");
        setScanning(false);
      }
    }

    start();
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleTagFound(tag: string) {
    controlsRef.current?.stop();
    setScanning(false);
    await lookupAndNavigate(tag);
  }

  async function lookupAndNavigate(tag: string) {
    try {
      const { data } = await api.get<CursorPage<ItemListRow>>("/items/", { params: { search: tag } });
      const match = data.results.find((i) => i.asset_tag === tag) ?? data.results[0];
      if (match) {
        navigate(`/items/${match.id}`);
      } else {
        setError(`No item found with asset tag "${tag}".`);
      }
    } catch {
      setError("Lookup failed. Try again.");
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-1">Scan asset tag</h1>
      <p className="text-sm text-treasury-slate mb-5">
        Point the camera at an item's QR/barcode asset tag to jump straight to its record.
      </p>

      <div className="card p-4">
        <video ref={videoRef} className="w-full rounded-md bg-black aspect-video" muted playsInline />
        {scanning && <p className="text-xs text-treasury-slate mt-2 text-center">Scanning...</p>}
      </div>

      {error && <p className="text-sm text-treasury-red mt-4">{error}</p>}

      <div className="mt-6">
        <label className="label">Or enter the asset tag manually</label>
        <div className="flex gap-2">
          <input
            className="input-field"
            value={manualTag}
            onChange={(e) => setManualTag(e.target.value)}
            placeholder="e.g. TNT-0001"
          />
          <button className="btn-secondary shrink-0" onClick={() => manualTag && lookupAndNavigate(manualTag)}>
            Look up
          </button>
        </div>
      </div>
    </div>
  );
}
