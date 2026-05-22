const LOGO_SRC = '/LOGO1.png';

export default function NavLogo({ onClick, className = '' }) {
  const image = (
    <span className="nav-logo-crop" aria-hidden="true">
      <img
        src={LOGO_SRC}
        alt=""
        decoding="async"
        className="nav-logo-glow nav-logo-img"
      />
    </span>
  );

  const baseClass = `nav-brand inline-flex items-center shrink-0 ${className}`.trim();

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} p-0 m-0 border-0 bg-transparent cursor-pointer`}
        aria-label="VROVEX — inicio"
      >
        {image}
      </button>
    );
  }

  return <span className={baseClass}>{image}</span>;
}
