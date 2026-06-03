select
    subprefeitura::varchar  as subprefeitura,
    geometry_wkt::varchar   as geometry_wkt
from {{ source('raw', 'raw_subprefeitura') }}
