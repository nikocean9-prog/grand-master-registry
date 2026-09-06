import Link from "next/link";

export default function SerialGrid({ serials, total = 100 }) {
  const formatNumber = (number, region) => {
    const formatted = String(number).padStart(total < 100 ? 2 : 3, "0");
    return region === "E" ? `${formatted}E` : formatted;
  };

  return (
    <div className="serial-grid">
      {serials.map((serial) => {
        const serialLabel = formatNumber(
          serial.serial_number,
          serial.region
        );
        const key = `${serial.region}-${serial.serial_number}`;

        if (serial.status === "confirmed") {
          return (
            <Link
              key={key}
              href={`/serial/${serial.id}`}
              className="serial-box confirmed"
              title="Confirmed — view details"
            >
              {serialLabel}
            </Link>
          );
        }

        return (
          <div
            key={key}
            className="serial-box unreported"
            title="Not yet reported"
          >
            {serialLabel}
          </div>
        );
      })}
    </div>
  );
}
