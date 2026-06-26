# 📱 MVP: Sitio Web PWA para Comunicación Interna

Este proyecto nace de la necesidad de una empresa privada que acudió a mis servicios buscando una solución rápida y eficaz para conectar con sus trabajadores. Para evitar los baches, costes de desarrollo y tiempos de aprobación de las tiendas de apps nativas (Play Store / App Store), optamos por desarrollar una **PWA (Progressive Web App)**. 

El resultado es una aplicación web moderna que los empleados pueden instalar directamente en la pantalla de inicio de sus dispositivos (Android/iOS), luciendo y funcionando con la fluidez de una app nativa.

##  Funcionalidades Principales

* **🔐 Autenticación y Control de Roles:** Sistema de inicio de sesión seguro. Cada usuario cuenta con un rol específico que define sus permisos dentro de la plataforma (por ejemplo, restricciones de edición para empleados y acceso total para administración).
* **📢 Tablón de Anuncios:** Un espacio dinámico para emitir la información diaria de la empresa, asegurando que las novedades importantes lleguen a cada trabajador al instante.
* **🏢 Valores Corporativos:** Una sección dedicada a plasmar la cultura y pilares de la organización, actualizable en tiempo real.

##  Tecnologías y Librerías Utilizadas

* **Frontend:** React (empaquetado con Vite) + Tailwind CSS para un diseño limpio, moderno y enfocado $100\%$ en dispositivos móviles (*Mobile-First*).
* **Backend & Base de Datos:** Supabase (PostgreSQL), aprovechando su sistema de autenticación nativa y el motor de *Postgres Changes* para la actualización de datos en tiempo real.
* **Despliegue:** Vercel (conectado al repositorio para integración continua).
* **Motor PWA:** `vite-plugin-pwa` para la generación automática del manifiesto, iconos y el Service Worker encargado de la instalación en los terminales.

##  Instalación en Local

Si deseas clonar este repositorio para realizar pruebas o desarrollo, sigue estos pasos en tu entorno de terminal (preferiblemente Linux/WSL2):

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/CamJ1203/App_empresa.git](https://github.com/CamJ1203/App_empresa.git)
   cd mi-app
