type HealthMeterProps = {
  label: string;
  value: number;
  maxValue: number;
  variant: 'player' | 'enemy';
};

export function HealthMeter({
  label,
  value,
  maxValue,
  variant,
}: HealthMeterProps) {
  const percentage =
    maxValue > 0 ? Math.min(100, Math.max(0, (value / maxValue) * 100)) : 0;
  const accessibleLabel = `${label[0]}${label.slice(1).toLowerCase()}`;

  return (
    <aside
      className={`hud hud--${variant}`}
      aria-label={`${accessibleLabel} status`}
    >
      <span className="hud__label">{label}</span>
      <div
        className="hud__meter"
        role="meter"
        aria-label={`${accessibleLabel} health`}
        aria-valuemin={0}
        aria-valuemax={maxValue}
        aria-valuenow={value}
      >
        <span
          className={`hud__meter-fill${
            variant === 'enemy' ? ' hud__meter-fill--enemy' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="hud__value">
        {value}/{maxValue}
      </span>
    </aside>
  );
}
