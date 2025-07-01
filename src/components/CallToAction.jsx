// CallToAction.jsx
export default function CallToAction({ onSignUp }) {
  return (
    <section
      style={{
        maxWidth: 540,
        margin: "56px auto 0 auto",
        background:
          "linear-gradient(99deg, rgba(255,91,46,0.97) 22%, #ffae5e 80%)",
        borderRadius: 24,
        boxShadow:
          "0 4px 40px 0 rgba(255,91,46,0.13), 0 2.5px 16px #0002",
        padding: "36px 22px 32px 22px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontWeight: 1000,
          color: "#fff",
          fontSize: 22,
          marginBottom: 16,
          letterSpacing: "-1.1px",
          textShadow: "0 2.5px 16px rgba(0,0,0,0.14)",
        }}
      >
        Ready to get started?
        <br />
        <span
          style={{
            fontWeight: 800,
            fontSize: 21,
            background:
              "linear-gradient(90deg, #fff 50%, #fff7e2 95%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Create your free account.
        </span>
      </div>
      <button
        onClick={onSignUp}
        style={{
          marginTop: 6,
          background:
            "linear-gradient(96deg, #fff 40%, #ffe0c2 100%)",
          color: "#eb423b",
          border: "none",
          borderRadius: 9,
          fontWeight: 900,
          fontSize: 17,
          padding: "10px 36px",
          boxShadow:
            "0 3px 16px 0 rgba(255,91,46,0.08), 0 1.5px 8px #ff5b2e15",
          cursor: "pointer",
          letterSpacing: "-0.5px",
          transition:
            "transform 0.14s, box-shadow 0.17s, background 0.22s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.055)";
          e.currentTarget.style.background =
            "linear-gradient(93deg, #ffe6d3 35%, #fff 90%)";
          e.currentTarget.style.boxShadow =
            "0 4px 22px 0 #ffae5e44, 0 2.5px 8px #eb423b30";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.background =
            "linear-gradient(96deg, #fff 40%, #ffe0c2 100%)";
          e.currentTarget.style.boxShadow =
            "0 3px 16px 0 rgba(255,91,46,0.08), 0 1.5px 8px #ff5b2e15";
        }}
      >
        Create your free account
      </button>
    </section>
  );
}
