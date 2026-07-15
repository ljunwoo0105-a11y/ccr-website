import { DEVICE_TYPES } from "../../../lib/config";
import type { IntakeInput } from "../../../lib/validation";

type DeviceSectionProps = {
  readonly deviceType: IntakeInput["deviceType"];
  readonly brand: string;
  readonly model: string;
  readonly imei: string;
  readonly serialNo: string;
  readonly onDeviceTypeChange: (value: IntakeInput["deviceType"]) => void;
  readonly onBrandChange: (value: string) => void;
  readonly onModelChange: (value: string) => void;
  readonly onImeiChange: (value: string) => void;
  readonly onSerialNoChange: (value: string) => void;
};

export function DeviceSection(props: DeviceSectionProps) {
  return (
    <section className="card">
      <h2 className="mb-4 text-base font-semibold text-carbon-950">Device</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="in-device" className="label">
            Device type
          </label>
          <select
            id="in-device"
            className="input"
            value={props.deviceType}
            onChange={(event) => {
              const selected = DEVICE_TYPES.find(
                (device) => device === event.target.value
              );
              if (selected) props.onDeviceTypeChange(selected);
            }}
          >
            {DEVICE_TYPES.map((device) => (
              <option key={device} value={device}>
                {device}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="in-brand" className="label">
            Brand
          </label>
          <input
            id="in-brand"
            className="input"
            required
            placeholder="Apple"
            value={props.brand}
            onChange={(event) => props.onBrandChange(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="in-model" className="label">
            Model
          </label>
          <input
            id="in-model"
            className="input"
            required
            placeholder="iPhone 14 Pro"
            value={props.model}
            onChange={(event) => props.onModelChange(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="in-imei" className="label">
            IMEI <span className="text-carbon-400">(optional)</span>
          </label>
          <input
            id="in-imei"
            className="input"
            value={props.imei}
            onChange={(event) => props.onImeiChange(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="in-serial" className="label">
            Serial no. <span className="text-carbon-400">(optional)</span>
          </label>
          <input
            id="in-serial"
            className="input"
            value={props.serialNo}
            onChange={(event) => props.onSerialNoChange(event.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
