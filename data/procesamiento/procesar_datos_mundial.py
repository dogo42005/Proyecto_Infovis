"""
Consolida el indicador del Banco Mundial "Individuals using the Internet
(% of population)" (data/cruda_mundial/) en una tabla larga por país y año
(data/procesada_mundial/).

Uso:
    python procesar_datos_mundial.py
"""
from pathlib import Path

import pandas as pd

BASE = Path(__file__).resolve().parents[1]
CRUDA = BASE / "cruda_mundial"
PROCESADA = BASE / "procesada_mundial"
PROCESADA.mkdir(exist_ok=True)

INDICADOR_CSV = CRUDA / "API_IT.NET.USER.ZS_DS2_en_csv_v2_468465.csv"
METADATA_PAISES_CSV = CRUDA / "Metadata_Country_API_IT.NET.USER.ZS_DS2_en_csv_v2_468465.csv"

# Centroides (lon/lat) por país: dataset abierto (MIT) de
# github.com/gavinr/world-countries-centroids, viene en ISO2 así que se cruza
# con la tabla ISO 3166-1 (github.com/lukes/ISO-3166-Countries-with-Regional-Codes,
# también MIT) para obtener el ISO3 y poder unirlo con el indicador del Banco Mundial.
MAPA_DIR = BASE.parent / "js" / "mapa"
CENTROIDES_CSV = MAPA_DIR / "paises_centroides.csv"
ISO2_ISO3_CSV = MAPA_DIR / "iso2_iso3.csv"

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


def main():
    procesar_uso_internet()
    procesar_centroides()


if __name__ == "__main__":
    main()
