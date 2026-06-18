# Documentos reais — AuPass (NÃO versionado)

Pasta para os **documentos reais** que alimentam o pipeline AuPass
(laudos de ensaio, licenças ANM/PLG, romaneios, packing lists, etc.).

## ⚠️ Sensível — fica só na sua máquina
Estes arquivos contêm dados sensíveis (CPF/CNPJ, coordenadas, dados comerciais).
Por isso a pasta está no `.gitignore` e **não sobe pro GitHub público**. Só este
`README.md` é versionado, como referência da pasta.

Se algum dia quiser publicar um documento (ex.: como prova/portfólio), anonimize
antes (remover CPF/CNPJ, coordenadas exatas) ou gere um equivalente fictício —
veja `samples/laudo-ouro-EXEMPLO.png` (documento de exemplo, marca d'água
"DOCUMENTO FICTÍCIO").

## Como usar
Arraste os documentos aqui e rode o pipeline apontando para o arquivo:

```bash
npm run passport -- ./documentos-reais/<seu-arquivo>.png
```

Formatos aceitos pelo OCR: imagens (`.png`, `.jpg`, `.bmp`...). Para PDF,
exporte/printe a página como imagem primeiro.

## Saída
O passaporte gerado vai para `out/` (também gitignored, exceto o `*.audit.json`).
