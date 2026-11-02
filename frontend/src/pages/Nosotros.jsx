import { Link } from 'react-router-dom';
import { HeroSeccion, Texto, Cierre } from '../components/ui/Seccion';
import { useSite } from '../context/SiteContext';

export default function Nosotros() {
  const { activa } = useSite();
  return (
    <div className="bg-crema-50">
      <HeroSeccion
        etiqueta="Nosotras"
        titulo="Somos Yerbateras"
        subtitulo="Diez años echando raíces, compartiendo saberes y cultivando otras formas de habitar el cuerpo."
      />

      <Texto>
        <p>
          Yerbateras es un proyecto de herbolaria feminista y ecofeminista que nace del amor por las plantas, los saberes
          ancestrales y la posibilidad de construir otras formas de relacionarnos con nuestros cuerpos, nuestros
          territorios y la vida.
        </p>
        <p>
          Somos un proyecto que mezcla plantas medicinales, rituales cotidianos, placer, creatividad y resistencia.
          Recuperamos y compartimos conocimientos que han viajado de generación en generación, reconociendo especialmente
          la sabiduría de las mujeres y de quienes han cuidado la vida a través de las plantas.
        </p>
        <p className="border-l-4 border-dorado-400 pl-5 text-verde-900 text-[1.3rem]">
          Creemos que el conocimiento sobre nuestros cuerpos no debería ser un privilegio, que el placer también es una
          forma de autonomía y que cuidarnos puede ser un acto profundamente político.
        </p>
        <p>
          Por eso hacemos productos botánicos, masajes, talleres y encuentros donde aprendemos, experimentamos y tejemos
          comunidad.
        </p>
        <p>
          Yerbateras también es una historia de migraciones, aprendizajes y raíces que vuelven a encontrar tierra. Hoy
          abrimos las puertas de nuestra Casa Taller en Bogotá para seguir cultivando este proyecto junto a otras personas.
        </p>
        <p>
          No venimos a venderte una fórmula mágica para la felicidad. Venimos a compartir saberes, despertar preguntas y
          recordarte que también puedes encontrar en las plantas otras maneras de cuidarte, sentirte y relacionarte con el
          mundo.
        </p>
      </Texto>

      <Cierre frase="Resistir también es hacer casa." sub="Bienvenidas a este aquelarre de plantas, cuerpos y rebeldías." />

      <div className="flex flex-wrap justify-center gap-3 pb-16 px-6">
        <Link to="/tienda" className="btn-primary">Ver la tienda</Link>
        {activa('talleres') && <Link to="/talleres" className="btn-outline">Talleres</Link>}
        {activa('citas') && <Link to="/citas" className="btn-outline">Masajes</Link>}
      </div>
    </div>
  );
}
