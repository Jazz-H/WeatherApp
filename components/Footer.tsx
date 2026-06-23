const linkClass =
  "text-white/70 hover:text-white underline decoration-white/30 underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

const Footer = () => (
  <footer className="mt-10 pt-6 border-t border-white/10 text-center text-xs text-white/50">
    <p>
      Weather by{" "}
      <a
        className={linkClass}
        href="https://open-meteo.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open-Meteo
      </a>{" "}
      · Location by{" "}
      <a
        className={linkClass}
        href="https://www.bigdatacloud.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        BigDataCloud
      </a>{" "}
      · Recommendations by Claude
    </p>
    <p className="mt-1">
      <a
        className={linkClass}
        href="https://github.com/Jazz-H/WeatherApp"
        target="_blank"
        rel="noopener noreferrer"
      >
        Clearcast
      </a>{" "}
      — built by Jazz-H
    </p>
  </footer>
);

export default Footer;
