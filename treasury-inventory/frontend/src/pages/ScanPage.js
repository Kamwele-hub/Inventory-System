import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { api } from "../api/client";
export default function ScanPage() {
    const videoRef = useRef(null);
    const controlsRef = useRef(null);
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
                const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
                    if (result && !cancelled) {
                        handleTagFound(result.getText());
                    }
                });
                controlsRef.current = controls;
            }
            catch {
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
    async function handleTagFound(tag) {
        controlsRef.current?.stop();
        setScanning(false);
        await lookupAndNavigate(tag);
    }
    async function lookupAndNavigate(tag) {
        try {
            const { data } = await api.get("/items/", { params: { search: tag } });
            const match = data.results.find((i) => i.asset_tag === tag) ?? data.results[0];
            if (match) {
                navigate(`/items/${match.id}`);
            }
            else {
                setError(`No item found with asset tag "${tag}".`);
            }
        }
        catch {
            setError("Lookup failed. Try again.");
        }
    }
    return (_jsxs("div", { className: "p-6 max-w-lg mx-auto", children: [_jsx("h1", { className: "text-xl font-semibold mb-1", children: "Scan asset tag" }), _jsx("p", { className: "text-sm text-treasury-slate mb-5", children: "Point the camera at an item's QR/barcode asset tag to jump straight to its record." }), _jsxs("div", { className: "card p-4", children: [_jsx("video", { ref: videoRef, className: "w-full rounded-md bg-black aspect-video", muted: true, playsInline: true }), scanning && _jsx("p", { className: "text-xs text-treasury-slate mt-2 text-center", children: "Scanning..." })] }), error && _jsx("p", { className: "text-sm text-treasury-red mt-4", children: error }), _jsxs("div", { className: "mt-6", children: [_jsx("label", { className: "label", children: "Or enter the asset tag manually" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { className: "input-field", value: manualTag, onChange: (e) => setManualTag(e.target.value), placeholder: "e.g. TNT-0001" }), _jsx("button", { className: "btn-secondary shrink-0", onClick: () => manualTag && lookupAndNavigate(manualTag), children: "Look up" })] })] })] }));
}
