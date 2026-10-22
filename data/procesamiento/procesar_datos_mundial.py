"""
Consolida el indicador del Banco Mundial "Individuals using the Internet
(% of population)" (data/cruda_mundial/) en una tabla larga por país y año
(data/procesada_mundial/).

Uso:
    python procesar_datos_mundial.py
"""
import json
import random
from pathlib import Path

import pandas as pd

BASE = Path(__file__).resolve().parents[1]
CRUDA = BASE / "cruda_mundial"
PROCESADA = BASE / "procesada_mundial"
PROCESADA.mkdir(exist_ok=True)

INDICADOR_CSV = CRUDA / "API_IT.NET.USER.ZS_DS2_en_csv_v2_468465.csv"
METADATA_PAISES_CSV = CRUDA / "Metadata_Country_API_IT.NET.USER.ZS_DS2_en_csv_v2_468465.csv"
POBLACION_JSON = CRUDA / "poblacion_total_worldbank.json"
DENSIDAD_JSON = CRUDA / "densidad_worldbank.json"

# Centroides (lon/lat) por país: dataset abierto (MIT) de
# github.com/gavinr/world-countries-centroids, viene en ISO2 así que se cruza
# con la tabla ISO 3166-1 (github.com/lukes/ISO-3166-Countries-with-Regional-Codes,
# también MIT) para obtener el ISO3 y poder unirlo con el indicador del Banco Mundial.
MAPA_DIR = BASE.parent / "js" / "mapa"
CENTROIDES_CSV = MAPA_DIR / "paises_centroides.csv"
ISO2_ISO3_CSV = MAPA_DIR / "iso2_iso3.csv"
# Fronteras reales de países (Natural Earth 110m, dominio público).
PAISES_GEOJSON = MAPA_DIR / "mundo_paises.geojson"

ICON_MAX = 50  # tope de íconos por país (el más poblado/conectado del mundo)
RNG_SEED = 42  # fija la dispersión de puntos para que sea reproducible

# Peso de cada país = usuarios_estimados (% × población) ajustado por su
# densidad poblacional (gente de verdad apretujada en poco territorio pesa
# un poco más, no solo "cuántos son en total"). DENSIDAD_EXPONENTE es
# deliberadamente chico: la densidad es un ajuste fino, no el factor
# principal — si pesara igual que población×%, el paso del tiempo
# (2000→2024, que se ve casi solo en el %) se diluiría con dos variables
# (población, densidad) que casi no cambian de un año a otro.
DENSIDAD_EXPONENTE = 0.15

# El peso se normaliza contra un percentil alto (no el máximo absoluto) para
# que un solo país extremo (China) no defina toda la escala él solo: con el
# máximo absoluto, India/EEUU/Alemania quedaban todos comprimidos muy abajo
# aunque también tuvieran cientos de millones de usuarios. Con el percentil
# 99.5, varios países "gigantes" (China, India) llegan juntos al tope en sus
# mejores años, y el resto de la escala queda con más resolución para
# separar a países "medianos" entre sí (ej. Chile vs EEUU).
CAP_PERCENTIL = 0.995

# 2000-2024: rango con cobertura amplia y estable (180-200 países por año).
# 2025 se excluye porque el Banco Mundial todavía tiene casi todo sin reportar
# (10 países en vez de ~180) y años previos a 2000 tienen huecos grandes.
ANIO_INICIO = 2000
ANIO_FIN = 2024


def procesar_uso_internet():
    datos = pd.read_csv(INDICADOR_CSV, skiprows=4)
    metadata = pd.read_csv(METADATA_PAISES_CSV)

    # Las filas de "Country Code" sin Región son agregados regionales/de
    # ingreso (ej. "World", "OECD members", "Africa Eastern and Southern"),
    # no países — se descartan para que el mapa no intente pintar un agregado
    # como si fuera un país.
    paises_reales = set(metadata.loc[metadata["Region"].notna(), "Country Code"])
    datos = datos[datos["Country Code"].isin(paises_reales)]

    anios = [str(a) for a in range(ANIO_INICIO, ANIO_FIN + 1)]
    largo = datos.melt(
        id_vars=["Country Name", "Country Code"],
        value_vars=anios,
        var_name="anio",
        value_name="pct_usuarios_internet",
    )
    largo["anio"] = largo["anio"].astype(int)
    largo = largo.rename(columns={"Country Name": "pais", "Country Code": "iso3"})
    largo = largo.dropna(subset=["pct_usuarios_internet"])
    largo = largo.sort_values(["anio", "pais"])

    salida = PROCESADA / "mundial_uso_internet.csv"
    largo.to_csv(salida, index=False)
    print(f"uso_internet: {len(largo)} filas, {largo['iso3'].nunique()} paises, {ANIO_INICIO}-{ANIO_FIN}")
    print(f"Archivo escrito en: {salida}")


def procesar_centroides():
    uso = pd.read_csv(PROCESADA / "mundial_uso_internet.csv")
    centroides = pd.read_csv(CENTROIDES_CSV)
    iso2_iso3 = pd.read_csv(ISO2_ISO3_CSV)

    con_iso3 = centroides.merge(
        iso2_iso3[["alpha-2", "alpha-3"]], left_on="ISO", right_on="alpha-2", how="left"
    )
    con_iso3 = con_iso3.rename(
        columns={"alpha-3": "iso3", "COUNTRY": "pais", "longitude": "lon", "latitude": "lat"}
    )

    # Solo países que efectivamente tienen datos de uso de internet (evita
    # arrastrar territorios sin esa serie al mapa).
    paises_con_datos = set(uso["iso3"].unique())
    con_iso3 = con_iso3[con_iso3["iso3"].isin(paises_con_datos)]
    con_iso3 = con_iso3.drop_duplicates(subset=["iso3"])[["iso3", "pais", "lon", "lat"]]
    con_iso3 = con_iso3.sort_values("pais")

    salida = PROCESADA / "mundial_centroides.csv"
    con_iso3.to_csv(salida, index=False)
    sin_centroide = sorted(paises_con_datos - set(con_iso3["iso3"]))
    print(f"centroides: {len(con_iso3)} de {len(paises_con_datos)} paises con datos (sin match: {sin_centroide})")
    print(f"Archivo escrito en: {salida}")


def procesar_poblacion():
    with open(POBLACION_JSON, encoding="utf-8") as f:
        bruto = json.load(f)[1]
    metadata = pd.read_csv(METADATA_PAISES_CSV)
    paises_reales = set(metadata.loc[metadata["Region"].notna(), "Country Code"])

    filas = [
        {"iso3": r["countryiso3code"], "anio": int(r["date"]), "poblacion": r["value"]}
        for r in bruto
        if r["value"] is not None and r["countryiso3code"] in paises_reales
    ]
    poblacion = pd.DataFrame(filas).sort_values(["anio", "iso3"])
    salida = PROCESADA / "mundial_poblacion.csv"
    poblacion.to_csv(salida, index=False)
    print(f"poblacion: {len(poblacion)} filas, {poblacion['iso3'].nunique()} paises, {ANIO_INICIO}-{ANIO_FIN}")
    print(f"Archivo escrito en: {salida}")


def procesar_densidad():
    """Densidad poblacional (Banco Mundial, personas por km² de superficie),
    misma fuente/API que población — usada como ajuste fino del peso de cada
    país (ver procesar_fronteras_y_puntos), no como factor principal."""
    with open(DENSIDAD_JSON, encoding="utf-8") as f:
        bruto = json.load(f)[1]
    metadata = pd.read_csv(METADATA_PAISES_CSV)
    paises_reales = set(metadata.loc[metadata["Region"].notna(), "Country Code"])

    filas = [
        {"iso3": r["countryiso3code"], "anio": int(r["date"]), "densidad": r["value"]}
        for r in bruto
        if r["value"] is not None and r["countryiso3code"] in paises_reales
    ]
    densidad = pd.DataFrame(filas).sort_values(["anio", "iso3"])
    salida = PROCESADA / "mundial_densidad.csv"
    densidad.to_csv(salida, index=False)
    print(f"densidad: {len(densidad)} filas, {densidad['iso3'].nunique()} paises, {ANIO_INICIO}-{ANIO_FIN}")
    print(f"Archivo escrito en: {salida}")


def _codigo_pais(propiedades):
    """ISO_A3 viene en -99 para un puñado de países (Francia, Noruega) en
    Natural Earth; se usa ADM0_A3 o WB_A3 como respaldo en esos casos."""
    for campo in ("ISO_A3", "ADM0_A3", "WB_A3"):
        valor = propiedades.get(campo)
        if valor and valor != "-99":
            return valor
    return None


def _punto_en_anillo(lon, lat, anillo):
    dentro = False
    n = len(anillo)
    j = n - 1
    for i in range(n):
        xi, yi = anillo[i]
        xj, yj = anillo[j]
        if (yi > lat) != (yj > lat):
            x_interseccion = (xj - xi) * (lat - yi) / (yj - yi) + xi
            if lon < x_interseccion:
                dentro = not dentro
        j = i
    return dentro


def _punto_en_poligono(lon, lat, poligono):
    # poligono: lista de anillos; el anillo 0 es el borde exterior, el resto
    # son huecos (lagos, enclaves) que se restan.
    if not _punto_en_anillo(lon, lat, poligono[0]):
        return False
    return not any(_punto_en_anillo(lon, lat, hueco) for hueco in poligono[1:])


def _punto_en_geometria(lon, lat, geometria):
    if geometria["type"] == "Polygon":
        return _punto_en_poligono(lon, lat, geometria["coordinates"])
    if geometria["type"] == "MultiPolygon":
        return any(_punto_en_poligono(lon, lat, poly) for poly in geometria["coordinates"])
    return False


def _bbox_de_geometria(geometria):
    coords = []

    def recolectar(nodo):
        if isinstance(nodo[0], (int, float)):
            coords.append(nodo)
        else:
            for sub in nodo:
                recolectar(sub)

    recolectar(geometria["coordinates"])
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    return min(lons), min(lats), max(lons), max(lats)


def _generar_puntos_aleatorios(geometria, n, rng, intentos_max=6000, evitar=None):
    """Sampleo puro al azar (rejection sampling). Se usa de respaldo para
    completar lo que la grilla no alcanza a cubrir (países muy chicos/finos)."""
    minlon, minlat, maxlon, maxlat = _bbox_de_geometria(geometria)
    evitar = evitar or set()
    puntos = []
    intentos = 0
    while len(puntos) < n and intentos < intentos_max:
        lon = rng.uniform(minlon, maxlon)
        lat = rng.uniform(minlat, maxlat)
        if (round(lon, 6), round(lat, 6)) not in evitar and _punto_en_geometria(lon, lat, geometria):
            puntos.append((lon, lat))
        intentos += 1
    return puntos


def _generar_puntos_grilla(geometria, n, rng, oversample=3):
    """Grilla con jitter: reparte celdas parejas por todo el bounding box del
    país (con margen de sobra — `oversample` — porque en países con forma
    irregular muchas celdas caen fuera del polígono y se descartan) y mueve
    cada punto al azar dentro de su celda. A diferencia del sampleo 100% al
    azar, esto evita que los puntos por casualidad queden amontonados en una
    esquina y deja el territorio cubierto de forma más pareja."""
    minlon, minlat, maxlon, maxlat = _bbox_de_geometria(geometria)
    ancho, alto = maxlon - minlon, maxlat - minlat
    if ancho <= 0 or alto <= 0:
        return []
    objetivo_celdas = max(n * oversample, 1)
    aspecto = ancho / alto
    filas = max(1, round((objetivo_celdas / aspecto) ** 0.5))
    cols = max(1, round(objetivo_celdas / filas))
    paso_lon, paso_lat = ancho / cols, alto / filas

    candidatos = []
    for i in range(cols):
        for j in range(filas):
            cx = minlon + (i + 0.5) * paso_lon
            cy = minlat + (j + 0.5) * paso_lat
            lon = cx + (rng.random() - 0.5) * paso_lon * 0.8
            lat = cy + (rng.random() - 0.5) * paso_lat * 0.8
            if _punto_en_geometria(lon, lat, geometria):
                candidatos.append((lon, lat))
    rng.shuffle(candidatos)
    return candidatos


def _generar_puntos(geometria, n, rng):
    puntos = _generar_puntos_grilla(geometria, n, rng)[:n]
    if len(puntos) < n:
        evitar = {(round(lo, 6), round(la, 6)) for lo, la in puntos}
        puntos += _generar_puntos_aleatorios(geometria, n - len(puntos), rng, evitar=evitar)
    return puntos


def procesar_fronteras_y_puntos():
    """Para cada país: genera una nube fija de puntos dispersos dentro de su
    polígono real (no solo cerca del centroide) y precalcula, por año, cuántos
    de esos puntos se muestran.

    La cantidad no es solo el % de uso: el peso de cada país-año es
        usuarios_estimados (% × población) × (densidad/densidad_mediana) ^ DENSIDAD_EXPONENTE
    — población y % hacen la mayor parte del trabajo (y son los que cambian
    año a año); la densidad es un ajuste fino que favorece algo a los países
    más "apretados" y penaliza algo a los más dispersos, sin opacar el resto.

    Ese peso se normaliza contra el percentil CAP_PERCENTIL (no el máximo
    absoluto) para que un solo país extremo (China) no defina toda la escala:
    con el máximo absoluto, India/EEUU/Alemania quedaban todos comprimidos
    muy abajo pese a tener también cientos de millones de usuarios."""
    with open(PAISES_GEOJSON, encoding="utf-8") as f:
        geo = json.load(f)
    geometria_por_iso3 = {}
    for feat in geo["features"]:
        codigo = _codigo_pais(feat["properties"])
        if codigo:
            geometria_por_iso3[codigo] = feat["geometry"]

    uso = pd.read_csv(PROCESADA / "mundial_uso_internet.csv")
    poblacion = pd.read_csv(PROCESADA / "mundial_poblacion.csv")
    densidad = pd.read_csv(PROCESADA / "mundial_densidad.csv")
    datos = uso.merge(poblacion, on=["iso3", "anio"], how="inner").merge(densidad, on=["iso3", "anio"], how="inner")
    datos["usuarios_estimados"] = datos["pct_usuarios_internet"] / 100 * datos["poblacion"]
    datos = datos[datos["iso3"].isin(geometria_por_iso3)]

    densidad_mediana = datos["densidad"].median()
    datos["peso"] = datos["usuarios_estimados"] * (datos["densidad"] / densidad_mediana) ** DENSIDAD_EXPONENTE
    peso_cap = datos["peso"].quantile(CAP_PERCENTIL)

    rng = random.Random(RNG_SEED)
    filas_puntos = []
    filas_conteo = []
    sin_puntos_suficientes = []
    paises_en_tope = set()

    for iso3, grupo in datos.groupby("iso3"):
        geometria = geometria_por_iso3[iso3]
        puntos = _generar_puntos(geometria, ICON_MAX, rng)
        if len(puntos) < ICON_MAX:
            sin_puntos_suficientes.append((iso3, len(puntos)))
        for idx, (lon, lat) in enumerate(puntos):
            filas_puntos.append({"iso3": iso3, "idx": idx, "lon": lon, "lat": lat})

        pool = max(len(puntos), 1)
        for _, fila in grupo.iterrows():
            ratio = min(fila["peso"] / peso_cap, 1.0) if peso_cap else 0
            count = round(ICON_MAX * ratio)
            if count >= ICON_MAX:
                paises_en_tope.add((iso3, int(fila["anio"])))
            # Piso mínimo SOLO si más de la mitad del país está conectado:
            # evita que un país chico con, digamos, 99% de uso (ej. Islandia)
            # se vea en 0 íconos y parezca un error al hacer hover. No se
            # aplica más abajo del 50% para no diluir el contraste 2000-2024
            # (casi nadie superaba 50% en 2000; esto no afecta esos años).
            if fila["pct_usuarios_internet"] > 50:
                count = max(count, 1)
            count = min(count, pool)
            filas_conteo.append({
                "iso3": iso3,
                "anio": int(fila["anio"]),
                "icono_count": count,
                "pct_usuarios_internet": fila["pct_usuarios_internet"],
                "poblacion": fila["poblacion"],
                "densidad": fila["densidad"],
                "usuarios_estimados": fila["usuarios_estimados"],
            })

    puntos_df = pd.DataFrame(filas_puntos).sort_values(["iso3", "idx"])
    conteo_df = pd.DataFrame(filas_conteo).sort_values(["anio", "iso3"])

    salida_puntos = PROCESADA / "mundial_puntos_icono.csv"
    salida_conteo = PROCESADA / "mundial_iconos.csv"
    puntos_df.to_csv(salida_puntos, index=False)
    conteo_df.to_csv(salida_conteo, index=False)

    print(f"puntos: {len(puntos_df)} en {puntos_df['iso3'].nunique()} paises (tope {ICON_MAX} c/u)")
    if sin_puntos_suficientes:
        print(f"  paises con menos puntos de los pedidos (forma muy chica/delgada): {sin_puntos_suficientes}")
    paises_en_tope_final = sorted(p for p, a in paises_en_tope if a == ANIO_FIN)
    print(f"iconos por anio: {len(conteo_df)} filas, cap = percentil {CAP_PERCENTIL} del peso (= {peso_cap:,.0f})")
    print(f"  paises en el tope ({ICON_MAX}) en {ANIO_FIN}: {paises_en_tope_final}")
    print(f"Archivos escritos en: {salida_puntos} y {salida_conteo}")


def procesar_promedio_mundial():
    """% mundial de uso de internet por año, ponderado por población (suma de
    usuarios estimados / suma de población) — no el promedio simple de cada
    país, que le daría a un microestado el mismo peso que a China. Usa los
    210 países con datos de uso+población, no solo los 169 con polígono."""
    uso = pd.read_csv(PROCESADA / "mundial_uso_internet.csv")
    poblacion = pd.read_csv(PROCESADA / "mundial_poblacion.csv")
    datos = uso.merge(poblacion, on=["iso3", "anio"], how="inner")
    datos["usuarios_estimados"] = datos["pct_usuarios_internet"] / 100 * datos["poblacion"]

    por_anio = datos.groupby("anio").agg(
        usuarios_estimados=("usuarios_estimados", "sum"),
        poblacion=("poblacion", "sum"),
    )
    por_anio["pct_mundial"] = por_anio["usuarios_estimados"] / por_anio["poblacion"] * 100
    por_anio = por_anio.reset_index()[["anio", "pct_mundial", "usuarios_estimados", "poblacion"]]

    salida = PROCESADA / "mundial_promedio.csv"
    por_anio.to_csv(salida, index=False)
    print(f"promedio mundial: {len(por_anio)} anios, {por_anio.iloc[0]['pct_mundial']:.1f}% en {ANIO_INICIO} -> {por_anio.iloc[-1]['pct_mundial']:.1f}% en {ANIO_FIN}")
    print(f"Archivo escrito en: {salida}")


def main():
    procesar_uso_internet()
    procesar_centroides()
    procesar_poblacion()
    procesar_densidad()
    procesar_promedio_mundial()
    procesar_fronteras_y_puntos()


if __name__ == "__main__":
    main()
