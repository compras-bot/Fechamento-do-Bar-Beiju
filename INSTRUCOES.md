# Beijupirá — Fechamento do Bar (Supabase + Vercel)

## 1. Criar o projeto no Supabase
1. Vá em https://supabase.com → **New project** (o plano free é suficiente).
2. Espere o projeto terminar de provisionar (uns 2 min).
3. Vá em **SQL Editor** → **New query**, cole o conteúdo do arquivo `schema.sql` e clique **RUN**.
4. Vá em **Storage** → **New bucket** → nome `fotos-fechamento` → marque **Public bucket** → criar.
   (o `schema.sql` já cria as políticas de acesso desse bucket, só falta criar o bucket em si)

## 2. Pegar as chaves
Em **Project Settings → API**:
- copie a **Project URL**
- copie a **anon public key**

Abra o arquivo `supabase-config.js` e cole os dois valores no lugar de:
```js
const SUPABASE_URL = "COLE_AQUI_A_URL_DO_SEU_PROJETO";
const SUPABASE_ANON_KEY = "COLE_AQUI_A_ANON_KEY";
```

## 3. Testar localmente (opcional)
Basta abrir o `index.html` no navegador, ou rodar um servidor simples:
```
npx serve .
```

## 4. Subir no Vercel
Como é um site estático (HTML/CSS/JS puro, sem build), o deploy é bem direto:

**Opção A — pelo site**
1. Suba os arquivos (`index.html`, `style.css`, `script.js`, `supabase-config.js`) num repositório no GitHub.
2. Em https://vercel.com → **Add New → Project** → importe o repositório.
3. Framework Preset: **Other** (ou deixe automático). Não precisa de build command nem output directory.
4. Deploy.

**Opção B — pela CLI**
```
npm i -g vercel
cd pasta-do-projeto
vercel
```

Não é necessário configurar variáveis de ambiente na Vercel, porque as chaves do Supabase já estão dentro do `supabase-config.js` (a anon key é pública por natureza — a segurança fica nas políticas de RLS do banco).

## 5. Onde ver os dados salvos
- **Dentro do próprio app**: aba "Relatório de fechamento" já busca direto no Supabase e mostra todos os registros, com filtro por período e responsável.
- **No painel do Supabase**: Table Editor → tabela `fechamentos` (dá pra ver, editar ou exportar como CSV).

## Observação de segurança
Como o app não tem login, qualquer pessoa com o link do site consegue ler e enviar registros (as políticas do `schema.sql` liberam isso pra chave anônima). Pra um app interno de uso da equipe do bar isso costuma ser aceitável, mas se quiser travar mais no futuro dá pra adicionar autenticação simples (Supabase Auth) e trocar as políticas de RLS pra exigir usuário logado.

## Novidades desta versão
1. **Múltiplas fotos por seção** — em Quebras, Desperdício (produtos/insumos), Limpeza e Fechamento agora dá pra anexar mais de uma foto (câmera ou galeria), com miniaturas e botão de remover cada uma.
   - **Ação necessária no banco:** rode de novo o `schema.sql` no SQL Editor do Supabase — ele agora cria 5 colunas novas (`foto_..._urls`, do tipo array de texto) usando `alter table ... add column if not exists`, então é seguro rodar em cima do banco que você já tem. As colunas antigas (`foto_..._url`) continuam existindo, só não são mais preenchidas em registros novos; o app já sabe ler as duas (`urlsOf()` no `script.js`).
2. **Indicadores tipo semáforo** — na aba "Relatório de fechamento", depois de buscar um período, aparece um painel 🚦 com uma bolinha por dia:
   - 🟢 verde = fechamento normal
   - 🟡 amarelo = teve quebra ou desperdício
   - 🔴 vermelho = teve "Problema" relatado ou a palavra "acabou" no estoque crítico
3. **Exportar por período** — na mesma aba, depois de buscar, aparecem os botões **📄 Exportar PDF** e **📊 Exportar Excel**, que exportam exatamente os registros do período buscado. Isso usa duas bibliotecas carregadas via CDN (`jsPDF` e `SheetJS`) — sem precisar de nenhuma configuração extra pro deploy na Vercel.
