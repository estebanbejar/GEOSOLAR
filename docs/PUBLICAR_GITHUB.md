# Publicar GEOSOLAR en GitHub Pages

Este repositorio incluye README, `.gitignore`, licencia y la configuración de publicación. No hay que crear esos archivos desde el formulario de GitHub.

## Activación inicial

1. Entrar en el repositorio y abrir **Settings → Pages**.
2. En **Build and deployment → Source**, elegir **GitHub Actions**.
3. Abrir **Actions → Comprobar y publicar GEOSOLAR**.
4. Si la primera ejecución terminó antes de activar Pages, usar **Re-run all jobs**; también se puede elegir **Run workflow → main**.
5. Esperar a que las comprobaciones y la publicación terminen correctamente. La dirección prevista es `https://estebanbejar.github.io/GEOSOLAR/`.

GitHub documenta esta configuración en [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Actualizaciones

Cada cambio en `main` ejecuta las comprobaciones, prepara la web y la publica. Las propuestas mediante pull request solo ejecutan las comprobaciones, sin publicar.

Los archivos publicados se preparan en `site/`: aplicación con código separado y descarga autónoma `GEOSOLAR.html`. No se publican pruebas, documentación interna ni archivos temporales en la web. El repositorio público sí contiene el código, las pruebas y estas guías.

No son necesarios secretos, cuentas PVGIS o servidores de cálculo. La configuración usa las acciones oficiales de GitHub y el permiso de publicación de Pages del propio repositorio.
