// Banda beige con el título de la página, justo debajo del menú (como en la referencia).
export default function BandaTitulo({ children }) {
  return (
    <div className="bg-[#e3d8c6] border-b border-[#d6c9b3] text-center py-3.5">
      <h1 className="text-[1.4rem] text-verde-900 tracking-wide">{children}</h1>
    </div>
  );
}
