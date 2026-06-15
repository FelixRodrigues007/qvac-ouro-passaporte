# samples/

Coloque aqui os documentos reais de ouro para testar (licença/PLG da ANM, laudos,
romaneios) — em imagem: `.jpg`, `.png`, `.bmp`.

**Estes arquivos NÃO são versionados** (estão no `.gitignore`), porque contêm dados
sensíveis (CPF/CNPJ, coordenadas, etc.). Cada pessoa do time coloca os seus localmente.

Exemplo de uso:

```bash
npm run passport -- ./samples/licenca-exemplo.jpg
```

Para um primeiro teste sem documento real, dá para baixar a imagem de exemplo do OCR
da QVAC:
https://github.com/tetherto/qvac/blob/main/packages/sdk/examples/image/basic_test.bmp
