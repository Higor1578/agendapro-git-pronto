import { currency } from "../utils/format.js";

export default function BookingCard({ booking, business, onStatusChange }) {
  return (
    <article className="booking-card">
      <div className="booking-time">
        <span>{booking.time}</span>
        <small>{booking.date}</small>
      </div>
      <div className="booking-main">
        <strong>{booking.client}</strong>
        <span>
          {booking.service} - {booking.professional} - {booking.phone || "sem telefone"}
        </span>
        {booking.notes ? <em>{booking.notes}</em> : null}
      </div>
      <div className="booking-meta">
        <span className="tag business-badge">{business.name}</span>
        <select
          aria-label="Status do agendamento"
          className={`status-select ${booking.status}`}
          onChange={(event) => onStatusChange?.(booking.id, event.target.value)}
          value={booking.status}
        >
          <option value="pendente">Pendente</option>
          <option value="confirmado">Confirmado</option>
          <option value="concluido">Concluido</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <strong>{currency.format(booking.price)}</strong>
      </div>
    </article>
  );
}
