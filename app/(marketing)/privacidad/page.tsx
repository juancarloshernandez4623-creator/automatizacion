import type { Metadata } from "next";
import { LegalLayout } from "../legal-layout";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Cómo Recepta Technologies trata los datos personales de negocios clientes y de sus clientes finales.",
};

const UPDATED = "7 de septiembre de 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Política de Privacidad" updated={UPDATED}>
      <p>
        En Recepta Technologies (&ldquo;<strong>Recepta</strong>&rdquo;, &ldquo;nosotros&rdquo;)
        desarrollamos y operamos una plataforma que conecta el WhatsApp Business y el Google
        Calendar de un negocio con un agente de inteligencia artificial que responde a sus
        clientes y agenda citas en su nombre. Esta política explica qué datos personales
        tratamos, con qué finalidad, con quién los compartimos y qué derechos tiene cualquier
        persona cuyos datos pasen por Recepta.
      </p>

      <h2>1. Quiénes somos</h2>
      <p>
        Recepta Technologies presta el servicio &ldquo;Recepta&rdquo; a negocios (clínicas,
        consultas y comercios similares, en adelante &ldquo;el negocio cliente&rdquo;) que
        contratan la plataforma para atender su propio WhatsApp. Puedes contactarnos en{" "}
        <a href="mailto:info@usarecepta.com">info@usarecepta.com</a> o en{" "}
        <a href="tel:+34625529758">+34 625 52 97 58</a> para cualquier consulta sobre esta
        política o sobre tus datos.
      </p>

      <h2>2. A quién aplica esta política</h2>
      <p>
        Esta política cubre dos situaciones distintas, porque Recepta trata datos con dos
        papeles diferentes:
      </p>
      <ul>
        <li>
          <strong>Datos del negocio cliente</strong> (la persona o empresa que contrata Recepta y
          usa el panel de control): aquí Recepta es <strong>responsable del tratamiento</strong>.
        </li>
        <li>
          <strong>Datos de los clientes finales del negocio</strong> (las personas que escriben
          por WhatsApp al negocio cliente y, en su caso, agendan una cita): aquí Recepta actúa
          como <strong>encargado del tratamiento</strong> por cuenta del negocio cliente, que es
          quien decide para qué usa esos datos y responde ante sus propios clientes. Si eres
          cliente final de un negocio que usa Recepta y quieres ejercer tus derechos, el primer
          paso es dirigirte directamente a ese negocio; si no obtienes respuesta, puedes
          escribirnos a nosotros y te ayudamos a canalizarlo.
        </li>
      </ul>

      <h2>3. Qué datos tratamos</h2>
      <p>Según el caso, tratamos los siguientes datos:</p>
      <ul>
        <li>
          <strong>Cuenta del negocio cliente:</strong> nombre, correo electrónico, contraseña
          (cifrada), nombre del negocio, dirección, teléfono, horario de atención, servicios y
          precios que el propio negocio configura para su agente.
        </li>
        <li>
          <strong>Conversaciones de WhatsApp:</strong> número de teléfono y nombre de perfil de
          quien escribe al negocio, y el contenido de los mensajes intercambiados con el agente.
        </li>
        <li>
          <strong>Citas agendadas:</strong> nombre completo, teléfono, servicio solicitado, fecha
          y hora, y si la persona es un cliente/paciente nuevo (cuando el negocio lo pide).
        </li>
        <li>
          <strong>Credenciales de integración:</strong> los tokens de acceso a la cuenta de
          WhatsApp Business (Meta) y a Google Calendar que el negocio cliente conecta desde su
          propio panel. Se almacenan siempre cifrados (ver sección 8), nunca en texto plano.
        </li>
        <li>
          <strong>Datos técnicos básicos:</strong> registros de actividad de la plataforma
          (fecha/hora de mensajes y peticiones) necesarios para el funcionamiento y la
          resolución de incidencias.
        </li>
      </ul>
      <p>
        Recepta no solicita ni trata categorías especiales de datos (por ejemplo, historiales
        clínicos) más allá de lo que el propio cliente final decida escribir libremente en la
        conversación de WhatsApp; no pedimos ni procesamos esa información de forma estructurada.
      </p>

      <h2>4. Con qué finalidad</h2>
      <ul>
        <li>Prestar el servicio contratado: dar de alta la cuenta del negocio y su panel.</li>
        <li>
          Hacer funcionar el agente de WhatsApp: recibir mensajes, generar una respuesta y
          enviarla de vuelta al cliente final.
        </li>
        <li>
          Consultar disponibilidad real y crear citas en el Google Calendar del negocio cliente.
        </li>
        <li>Facturar la suscripción y dar soporte técnico al negocio cliente.</li>
        <li>Mantener la seguridad de la plataforma y prevenir usos indebidos.</li>
      </ul>

      <h2>5. Base legal</h2>
      <p>
        Tratamos los datos del negocio cliente para ejecutar el contrato de prestación del
        servicio. Tratamos los datos de los clientes finales por cuenta del negocio cliente,
        conforme a las instrucciones que este nos da al configurar y usar la plataforma
        (ejecución del contrato entre Recepta y el negocio, e interés legítimo de ambos en que la
        conversación de WhatsApp se atienda correctamente).
      </p>

      <h2>6. Con quién compartimos los datos</h2>
      <p>
        Para poder prestar el servicio, los datos pasan por los siguientes proveedores, en la
        medida estrictamente necesaria para que la plataforma funcione:
      </p>
      <ul>
        <li>
          <strong>Meta / WhatsApp Cloud API:</strong> para enviar y recibir los mensajes de
          WhatsApp del negocio cliente.
        </li>
        <li>
          <strong>Google (Google Calendar API):</strong> para consultar disponibilidad y crear
          eventos en el calendario que el negocio cliente conecta.
        </li>
        <li>
          <strong>Anthropic (modelo Claude):</strong> el contenido de la conversación se envía a
          este proveedor de inteligencia artificial para generar la respuesta del agente.
        </li>
        <li>
          <strong>Supabase:</strong> aloja la base de datos y la autenticación de la plataforma.
        </li>
        <li>
          <strong>Vercel:</strong> aloja la aplicación web y ejecuta el procesamiento de los
          mensajes entrantes.
        </li>
      </ul>
      <p>
        No vendemos datos personales a terceros ni los usamos con fines publicitarios. Algunos de
        estos proveedores pueden procesar datos fuera del Espacio Económico Europeo (por ejemplo,
        en Estados Unidos); en esos casos nos apoyamos en las garantías que ofrecen dichos
        proveedores (como las cláusulas contractuales tipo de la Comisión Europea) para la
        transferencia internacional.
      </p>

      <h2>7. Cuánto tiempo conservamos los datos</h2>
      <p>
        Conservamos los datos de la cuenta y de las conversaciones mientras el negocio cliente
        mantenga su suscripción activa. Si el negocio cliente cancela su cuenta, eliminamos o
        anonimizamos sus datos y los de sus conversaciones en un plazo razonable, salvo que la
        ley nos obligue a conservar algún dato por más tiempo (por ejemplo, obligaciones
        fiscales sobre la facturación).
      </p>

      <h2>8. Cómo protegemos los datos</h2>
      <p>
        Las credenciales de integración (tokens de acceso a WhatsApp y a Google Calendar) se
        cifran en reposo con AES-256-GCM antes de guardarse en base de datos. Cada negocio
        cliente está aislado del resto a nivel de base de datos (cada registro pertenece a una
        única organización y solo es accesible dentro de ella), de forma que un negocio nunca
        puede ver las conversaciones, citas o credenciales de otro. Las comunicaciones con la
        plataforma viajan cifradas (HTTPS/TLS).
      </p>

      <h2>9. Tus derechos</h2>
      <p>
        Si tus datos son tratados por Recepta como responsable (por ejemplo, si tienes una cuenta
        de negocio cliente), puedes ejercer en cualquier momento tus derechos de acceso,
        rectificación, supresión, oposición, limitación del tratamiento y portabilidad
        escribiendo a <a href="mailto:info@usarecepta.com">info@usarecepta.com</a>. Responderemos
        en el plazo que marca la normativa aplicable. También tienes derecho a presentar una
        reclamación ante la autoridad de control competente (en España, la Agencia Española de
        Protección de Datos).
      </p>

      <h2>10. Cookies y datos de sesión</h2>
      <p>
        El panel de Recepta usa únicamente cookies técnicas necesarias para mantener tu sesión
        iniciada (gestionadas por nuestro proveedor de autenticación). No usamos cookies de
        publicidad ni de seguimiento de terceros en la plataforma.
      </p>

      <h2>11. Menores de edad</h2>
      <p>
        Recepta está pensado para uso por negocios y profesionales, no para menores de edad. No
        recogemos intencionadamente cuentas de negocio de menores de edad.
      </p>

      <h2>12. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política cuando cambie el servicio o la normativa aplicable.
        Publicaremos siempre la versión vigente en esta misma página, indicando la fecha de la
        última actualización.
      </p>

      <h2>13. Contacto</h2>
      <p>
        Para cualquier duda sobre esta política o sobre el tratamiento de tus datos, escríbenos a{" "}
        <a href="mailto:info@usarecepta.com">info@usarecepta.com</a>.
      </p>
    </LegalLayout>
  );
}
