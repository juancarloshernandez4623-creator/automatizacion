import type { Metadata } from "next";
import { LegalLayout } from "../legal-layout";

export const metadata: Metadata = {
  title: "Condiciones del Servicio",
  description: "Condiciones de uso de la plataforma Recepta para negocios clientes.",
};

const UPDATED = "7 de septiembre de 2026";

export default function TermsPage() {
  return (
    <LegalLayout title="Condiciones del Servicio" updated={UPDATED}>
      <p>
        Estas condiciones regulan el uso de la plataforma Recepta, ofrecida por Recepta
        Technologies (&ldquo;Recepta&rdquo;, &ldquo;nosotros&rdquo;) a negocios que la contratan
        para atender su WhatsApp con un agente de inteligencia artificial. Al crear una cuenta o
        usar la plataforma, el negocio cliente acepta estas condiciones.
      </p>

      <h2>1. El servicio</h2>
      <p>
        Recepta conecta el WhatsApp Business y el Google Calendar del negocio cliente con un
        agente configurable que responde a sus clientes finales y puede agendar citas
        directamente en el calendario conectado, siguiendo la configuración (tono, servicios,
        horarios y reglas) que el propio negocio define en su panel.
      </p>

      <h2>2. Cuenta y responsabilidad del negocio cliente</h2>
      <ul>
        <li>El negocio cliente es responsable de la veracidad de los datos de su cuenta.</li>
        <li>
          El negocio cliente es responsable de contar con la titularidad y los permisos
          necesarios sobre el número de WhatsApp Business y el Google Calendar que conecta a la
          plataforma.
        </li>
        <li>
          El negocio cliente es responsable de la configuración del agente (información,
          precios, horarios y reglas de atención) y de revisar que sea correcta.
        </li>
        <li>
          El negocio cliente es responsable, frente a sus propios clientes finales, del
          tratamiento de los datos que estos comparten por WhatsApp, conforme a la normativa de
          protección de datos aplicable (ver nuestra{" "}
          <a href="/privacidad">Política de Privacidad</a>).
        </li>
      </ul>

      <h2>3. Uso aceptable</h2>
      <p>
        El negocio cliente se compromete a usar Recepta conforme a la ley y a las políticas de
        uso de WhatsApp Business y de Google, y a no usar la plataforma para enviar comunicaciones
        no solicitadas, contenido ilegal, engañoso o que infrinja derechos de terceros.
      </p>

      <h2>4. Planes y facturación</h2>
      <p>
        El acceso a Recepta está sujeto a los precios y condiciones de facturación vigentes en el
        momento de la contratación, que se comunican al negocio cliente antes de activar el
        servicio. Recepta puede suspender el acceso a la plataforma en caso de impago tras el
        aviso correspondiente.
      </p>

      <h2>5. Disponibilidad del servicio</h2>
      <p>
        Nos esforzamos por mantener la plataforma disponible de forma continua, pero el servicio
        depende en parte de proveedores externos (Meta/WhatsApp, Google, y el proveedor del
        modelo de inteligencia artificial), por lo que no podemos garantizar una disponibilidad
        del 100%. Ante una incidencia relevante, informaremos al negocio cliente y trabajaremos
        para resolverla lo antes posible.
      </p>

      <h2>6. Limitación de responsabilidad</h2>
      <p>
        El agente responde de forma automática según la configuración e información
        proporcionadas por el propio negocio cliente. Recomendamos revisar periódicamente las
        conversaciones y citas generadas. Recepta no será responsable de decisiones tomadas
        exclusivamente a partir de una respuesta del agente que contradiga la configuración
        proporcionada por el negocio, ni de interrupciones causadas por proveedores externos
        ajenos a nuestro control.
      </p>

      <h2>7. Cancelación</h2>
      <p>
        El negocio cliente puede solicitar la cancelación de su cuenta en cualquier momento
        escribiendo a <a href="mailto:info@usarecepta.com">info@usarecepta.com</a>. Tras la
        cancelación, dejaremos de procesar nuevos mensajes y trataremos los datos conforme a lo
        descrito en nuestra <a href="/privacidad">Política de Privacidad</a>.
      </p>

      <h2>8. Cambios en estas condiciones</h2>
      <p>
        Podemos actualizar estas condiciones cuando cambie el servicio. Publicaremos siempre la
        versión vigente en esta página, indicando la fecha de la última actualización.
      </p>

      <h2>9. Contacto</h2>
      <p>
        Para cualquier duda sobre estas condiciones, escríbenos a{" "}
        <a href="mailto:info@usarecepta.com">info@usarecepta.com</a>.
      </p>
    </LegalLayout>
  );
}
