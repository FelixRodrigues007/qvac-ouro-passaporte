# samples/

Place the real gold documents here for testing (ANM license/PLG, assay reports,
packing lists) — as an image: `.jpg`, `.png`, `.bmp`.

**These files are NOT versioned** (they are in `.gitignore`), because they contain
sensitive data (CPF/CNPJ, coordinates, etc.). Each team member places their own locally.

Example usage:

```bash
npm run passport -- ./samples/licenca-exemplo.jpg
```

For a first test without a real document, you can download QVAC's OCR example image:
https://github.com/tetherto/qvac/blob/main/packages/sdk/examples/image/basic_test.bmp
