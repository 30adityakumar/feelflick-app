import BackButton from './BackButton'

export default function StepHeader({ className = '', onBack, kicker, children, subcopy, subcopyClassName = '' }) {
  return (
    <div className={`ob-step-header ${className}`}>
      {onBack && <BackButton onClick={onBack} />}
      <p className="ob-step-kicker">{kicker}</p>
      <h2 className="ob-step-title" style={{ textWrap: 'balance' }}>
        {children}
      </h2>
      {subcopy != null && (
        <p className={`ob-step-copy ${subcopyClassName}`}>{subcopy}</p>
      )}
    </div>
  )
}
