import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";   

const supabaseUrl = "https://otvcwvnlndxtzzmeqtcw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90dmN3dm5sbmR4dHp6bWVxdGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NTg0OTQsImV4cCI6MjA2MzMzNDQ5NH0.psGUAZjKc_Ic9CFeumOIwS5DNWkgtABNZlcN0iig0cE";
const supabase = createClient(supabaseUrl, supabaseKey);

function showMessage(message, type) {
    const messageDisplay = document.getElementById('messageDisplay');
    if (!messageDisplay) return;
    messageDisplay.textContent = message;
    messageDisplay.className = `center message-box ${type} show`;
    setTimeout(() => {
        messageDisplay.classList.remove('show');
    }, 3000);
}

function toggleStaticMessage(elementId) {
    const mensajeAceptado = document.getElementById("mensajeAceptado");
    const mensajeRechazado = document.getElementById("mensajeRechazado");
    if (mensajeAceptado) mensajeAceptado.classList.remove('show');
    if (mensajeRechazado) mensajeRechazado.classList.remove('show');
    const element = document.getElementById(elementId);
    if (element) element.classList.add('show');
}

function hideButtons() {
    const btnAceptar = document.getElementById("btnAceptar");
    const btnRechazar1 = document.getElementById("btnRechazar1");
    const btnRechazar2 = document.getElementById("btnRechazar2");
    const btnVolver = document.getElementById("btnVolver");
    const dynamicLink = document.getElementById("dynamicLink");
    
    if (btnAceptar) btnAceptar.style.display = 'none';
    if (btnRechazar1) btnRechazar1.style.display = 'none';
    if (btnRechazar2) btnRechazar2.style.display = 'none';
    if (btnVolver) btnVolver.style.display = 'none';
    if (dynamicLink) dynamicLink.style.display = 'none';
}

function setLinkHref(url, archivoNombre) {
    const linkElement = document.getElementById('dynamicLink');
    if (linkElement) {
        linkElement.href = url;
        linkElement.textContent = archivoNombre || "Ver archivo";
        linkElement.target = "_blank";
        linkElement.rel = "noopener noreferrer";
    } else {
        console.error("❌ No se encontró el elemento con ID 'dynamicLink'");
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);

    const gradoParam = params.get("grado");
    const nombreParam = params.get("nombre");
    const archivoParam = params.get("archivo");
    const fileUrl = params.get("url");
    const solicitudId = params.get("id");

    const gradoEl = document.querySelector("p.grado");
    const nombreEl = document.querySelector("p.nombre");
    const archivoEl = document.querySelector("p.archivo");

    if (gradoEl) gradoEl.textContent = gradoParam || "No definido";
    if (nombreEl) nombreEl.textContent = nombreParam || "No definido";
    if (archivoEl) archivoEl.textContent = archivoParam || "No definido";

    if (fileUrl) {
        const decodedUrl = decodeURIComponent(fileUrl);
        setLinkHref(decodedUrl);
        console.log("✅ Enlace actualizado a:", decodedUrl);
    } else {
        const linkElement = document.getElementById('dynamicLink');
        if (linkElement) {
            linkElement.style.pointerEvents = 'none';
            linkElement.style.color = 'gray';
            linkElement.textContent = 'Archivo no disponible';
        }
        console.warn("⚠️ Falta el parámetro 'url' en la URL.");
    }

    if (!solicitudId) {
        showMessage("❌ No se especificó el ID de la solicitud.", "error");
        hideButtons();
        return;
    }

    const { data, error } = await supabase
        .from("Registro_servicio_social")
        .select("Estado")
        .eq("id_registro", solicitudId)
        .single();

    if (error && error.code === 'PGRST116') {
        toggleStaticMessage("mensajeRechazado");
        hideButtons();
        console.log("ℹ️ Solicitud rechazada (no existe).");
    } else if (data && data.Estado === true) {
        toggleStaticMessage("mensajeAceptado");
        hideButtons();
        console.log("ℹ️ Solicitud ya aceptada.");
    } else {
        console.log("ℹ️ Solicitud pendiente.");

        const btnAceptar = document.getElementById("btnAceptar");
        const btnRechazar1 = document.getElementById("btnRechazar1");
        const btnRechazar2 = document.getElementById("btnRechazar2");
        const btnVolver = document.getElementById("btnVolver");
        const razonForm = document.getElementById("razon_form");
        const razonTextarea = document.getElementById("razon");

        // --- Ocultar elementos al inicio ---
        if (btnRechazar2) btnRechazar2.style.display = "none";
        if (btnVolver) btnVolver.style.display = "none";
        if (razonForm) razonForm.style.display = "none";

        btnAceptar?.addEventListener("click", async () => {
            showMessage("⏳ Procesando aceptación...", "info");
            const { error: updateError } = await supabase
                .from("Registro_servicio_social")
                .update({ Estado: true })
                .eq("id_registro", solicitudId);

            if (updateError) {
                console.error("❌ Error al aceptar:", updateError);
                showMessage("❌ Error al aceptar la solicitud.", "error");
            } else {
                showMessage("✅ Solicitud aceptada correctamente.", "success");
                toggleStaticMessage("mensajeAceptado");
                hideButtons();
            }
        });

        // --- Mostrar formulario y btnRechazar2 al presionar btnRechazar1 ---
        btnRechazar1?.addEventListener("click", () => {
            if (btnRechazar2) btnRechazar2.style.display = "inline-block";
            if (btnVolver) btnVolver.style.display = "inline-block";
            if (razonForm) razonForm.style.display = "block";
            if (btnRechazar1) btnRechazar1.style.display = "none";
            if (btnAceptar) btnAceptar.style.display = "none";
        });

        // --- Botón Volver solo funciona si hay texto en el textarea ---
        btnVolver?.addEventListener("click", () => {
            const texto = razonTextarea ? razonTextarea.value.trim() : "";
            if (!texto) {
                showMessage("❌ Inserte una razón antes de volver.", "error");
                return;
            }
            // Ocultar los elementos de rechazo y el propio botón Volver
            if (btnRechazar2) btnRechazar2.style.display = "none";
            if (razonForm) razonForm.style.display = "none";
            if (btnVolver) btnVolver.style.display = "none";

            // Volver a mostrar los botones originales
            if (btnAceptar) btnAceptar.style.display = "inline-block";
            if (btnRechazar1) btnRechazar1.style.display = "inline-block";
        });

        // --- Lógica de rechazo ahora en btnRechazar2 ---
        btnRechazar2?.addEventListener("click", async () => {
            const razonTexto = razonTextarea ? razonTextarea.value.trim() : "";

            // Validación: no puede estar vacío
            if (!razonTexto) {
                showMessage("❌ Inserte una razón para continuar.", "error");
                return;
            }

            showMessage("⏳ Procesando rechazo...", "info");

            const { data, error } = await supabase
                .from("Registro_servicio_social")
                .select("*")
                .eq("id_registro", solicitudId)
                .single();

            if (error) {
                console.error("Error al seleccionar:", error);
                return;
            }

            if (data) {
                const { data: inserted, error: insertError } = await supabase
                    .from("Registro_archivos_soporte")
                    .insert([{
                        id: data.id_registro,
                        Grado: data.Grado,
                        Nombre: data.Nombre,
                        Nombrearchivo: data.Nombrearchivo,
                        Url: data.Url,
                        Correo: data.Correo,
                        Razon: razonTexto
                    }])
                    .select();

                if (insertError) console.error("Error al insertar:", insertError);
                else console.log("Fila insertada:", inserted);
            }

            const { error: deleteError } = await supabase
                .from("Registro_servicio_social")
                .delete()
                .eq("id_registro", solicitudId);

            if (deleteError) {
                console.error("❌ Error al rechazar:", deleteError);
                showMessage("❌ Error al rechazar la solicitud.", "error");
                return;
            }

            const bucket = "colegioserviciosocial";
            const archivoPath = `${gradoParam}/${nombreParam}/${archivoParam}`;

            const { error: storageError } = await supabase
                .storage
                .from(bucket)
                .remove([archivoPath]);

            if (storageError) showMessage("⚠️ Solicitud rechazada, pero hubo un problema al eliminar el archivo.", "warning");
            else showMessage("✅ Solicitud rechazada correctamente.", "success");

            toggleStaticMessage("mensajeRechazado");
            hideButtons();
        });
    }
});
