# Decisões
> queremos ver como você pensa, não só o que você construiu

Diário de bordo, data estelar `123.4`

Primeiramente, tenho uma visão de arquitetura de serviços em detrimento de produtos.
Considero toda a experiência de quem vai utilizar a aplicação, e não somente pontos de entrada, processamento e saída.
Essa necessidade de obter uma visão holística sobre o que vai ser projetado me leva a responder um pequeno questionário antes de começar a codar loucamente.

Um disclaimer breve: como nada (ou quase nada) se cria, não posso deixar de referenciar a minha fonte.
Hoje uso basicamente esse [Tech Guide do ArjanCodes](https://s3.amazonaws.com/kajabi-storefronts-production/file-uploads/sites/2147536565/themes/2149113639/downloads/665a8d-05ca-456a-a242-f0f015e70456_Software_Design_Guide.pdf) que consolida os principais pontos de preocupação antes de iniciar o projeto.



considero prudente responder algumas questões.

## Escolhas Tecnológicas

Antes de mais nada, vamos falar um pouco sobre a estrutura do repositório.

### Repositório

```text
desafio-tech-lead-pic/
├── README.md
├── docs/
│   └── decisoes.md          
├── data/                    # dados exportados do BigQuery (não commitar)
│   └── .gitkeep
├── pipeline/                # dbt project
│   ├── models/
│   │   ├── intermediate/
│   │   └── mart/
│   ├── dbt_project.yml
│   └── profiles.yml.example
├── backend/
│   ├── api/
│   ├── tests/
│   └── README.md            # como rodar
└── frontend/
    ├── app/
    └── README.md            # como rodar
````

Para fins de avaliação, vamos seguir a sugestão e usar apenas um repositório.
Contudo, na vida real eu advogaria pela divisão nos seguintes repositórios:

```
dados -> Extração, Transformação e Carga de dados
backend -> Acesso ao banco e para servir o frontend
frontend -> Serve conteúdo ao cliente final
gateway -> Restrições de acesso
```

Mas Mauro, por que você dividiria?
* Responsabilidades claramente diferentes
* Tecnologias diferentes
* Necessidade de conhecer (dev do frontend não precisa ou talvez nem deva ter acesso ao processo de ETL)
* Simplicidade de configuração de GitHub Actions / GitLab CI

### Gerenciadores de Dependências

Vamos trabalhar basicamente com as linguagens Python e Typescript.

Gerencio pacotes com de Python com [uv]() em detrimento de `pip` ou `poetry`.
uv tem uma técnica específica de resolução de dependências em grafo, que é seu grande diferencial.
Além disso, é escrito em Rust. Isso o torna extremamente rápido.

Já pro Typescript vamos trabalhar com [pnpm]() em detrimento do [npm]().
Isso se deve basicamente a sua velocidade e eficiência de disco.

Após a leitura dso requisitos eu me deparei com a terrível realidade de que eu não conhecia DuckBD.
Poderia usar SQLite? Poderia, mas se fosse pra fazer mais do mesmo a gente entregava o projeto nas mãos de um vibecoder.
Como esse não é o caso, fui procurar saber mais sobre.
E como nada resiste a uma boa pesquisa, compreendi a ferramenta e vi que realmente seria muito útil para o projeto (e pra minha vida).

## Tradeoffs e dívida técnica

## Padrões e boas práticas

## Escalabilidade e manutenção
> como o sistema se comporta à medida que cresce, e o que mudaria com mais dados, mais usuários ou mais secretarias