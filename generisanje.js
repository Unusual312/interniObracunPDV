document.addEventListener("DOMContentLoaded", function () {
    let selectedVrstaRacuna = "Nedefinisano"; // Default value
    let selectedVrstaPromene = "Nedefinisano"; // Default value

    document.querySelectorAll('#screen1 .box').forEach(box => {
        box.addEventListener('click', function () {
            selectedVrstaRacuna = this.textContent.trim();
            console.log("Selected Vrsta Računa:", selectedVrstaRacuna); 
        });
    });

    document.querySelectorAll('#screen2 .box').forEach(box => {
        box.addEventListener('click', function () {
            selectedVrstaPromene = this.textContent.trim();
            console.log("Selected Vrsta Promene:", selectedVrstaPromene); 
        });
    });

    function generatePDF() {
        console.log("Generate PDF function triggered"); // Debugging log

        // Collect form input values
        const vrstaRacuna = selectedVrstaRacuna;
        const vrstaPromene = selectedVrstaPromene;
        const redniBroj = document.querySelector('input[placeholder="Unesite redni broj internog računa"]')?.value || "";
        const povezanBroj = document.querySelector('input[placeholder="Unesite broj povezanog internog računa"]')?.value || "";
        const datumSacinjavanja = document.querySelector('input[placeholder="Unesite datum sačinjavanja internog računa"]')?.value || "";
        const datumNastankaObaveze = document.querySelector('input[placeholder="Unesite datum nastanka poreske obaveze, odnosno smanjenja naknade ili avansa"]')?.value || "";
        const valuta = document.querySelector('input[name="currency"]')?.value || "";
        const sacinjavalacOdgovornoLice = document.querySelector('#sacinjavalacOdgovornoLice')?.value || "";
        const srednjiKurs = parseFloat(
            document.querySelector('input[id="kurs"]')?.value.replace(',', '.') || "0"
        );
        if (isNaN(srednjiKurs)) {
            alert("Nepravilno unešen kurs, molimo Vas da ispravite u numeričku vrednost!");
            return;
        }
        
        // Debugging logs
        console.log({ redniBroj, povezanBroj, datumSacinjavanja, datumNastankaObaveze, valuta, srednjiKurs });

        // Sacinjavalac (Invoice Creator) details
        const sacinjavalacNaziv = document.querySelector('#sacinjavalacNaziv')?.value || "";
        const sacinjavalacAdresa = document.querySelector('#sacinjavalacAdresa')?.value || "";
        const sacinjavalacPoreskiBroj = document.querySelector('#sacinjavalacPoreskiBroj')?.value || "";

        // Debugging log for creator details
        console.log({ sacinjavalacNaziv, sacinjavalacAdresa, sacinjavalacPoreskiBroj });

        // Isporucilac (Supplier) details
        const isporucilacNaziv = document.querySelector('#isporucilacNaziv')?.value || "";
        const isporucilacAdresa = document.querySelector('#isporucilacAdresa')?.value || "";
        const isporucilacPoreskiBroj = document.querySelector('#isporucilacPoreskiBroj')?.value || "";

        // Debugging log for supplier details
        console.log({ isporucilacNaziv, isporucilacAdresa, isporucilacPoreskiBroj });

        function formatWithThousandSeparators(num) {
            const parts = num.toFixed(2).split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            return parts.join(",");
        }

        // Collect table data
        const tableRows = [];
        let sumOfRowCenaRSD = 0;
        document.querySelectorAll("#dataTable tbody tr").forEach((row, index) => {
            const cols = row.querySelectorAll("td");
            const cenaUValuti = parseFloat(cols[2]?.querySelector("input")?.value.trim().replace(/\./g, '').replace(',', '.') || "0");
            const cenaURSD = cenaUValuti * parseFloat(srednjiKurs);
            const poreznaStopa = 20; // Standard VAT rate
            const poreznaOsnovica = cenaURSD;
            const porezIznos = poreznaOsnovica * (poreznaStopa / 100);

            tableRows.push([
                index + 1, // R.br
                cols[1]?.querySelector("textarea")?.value.trim() || "", // Opis
                formatWithThousandSeparators(cenaUValuti), // Cena u valuti
                srednjiKurs, // Srednji kurs
                formatWithThousandSeparators(cenaURSD), // Cena u RSD
                formatWithThousandSeparators(poreznaOsnovica), // Poreska osnovica
                `${poreznaStopa}%`, // Poreska stopa
                formatWithThousandSeparators(porezIznos) // Porez iznos
            ]);

            sumOfRowCenaRSD += cenaURSD;
        });

        function cleanFormattedNumber(numStr) {return parseFloat(numStr.replace(/\./g, '').replace(',', '.'));}

        const ukupnoPoreskaOsnovica = formatWithThousandSeparators(tableRows.reduce((sum, row) => sum + cleanFormattedNumber(row[5]), 0));
        const ukupnoPDV = formatWithThousandSeparators(tableRows.reduce((sum, row) => sum + cleanFormattedNumber(row[7]), 0));

        // Debugging log for table data
        console.log({ tableRows, sumOfRowCenaRSD, ukupnoPoreskaOsnovica, ukupnoPDV });

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 60],
            content: [
                { text: vrstaRacuna, style: 'boldRow', margin: [0, 0, 0, 5] },
                { text: vrstaPromene, style: 'italicRow', margin: [0, 5, 0, 5] },
                { text: '', margin: [0, 5] },
                { text: `Broj internog računa: ${redniBroj}`, bold: true },
                { text: `Broj povezanog internog računa: ${povezanBroj}`, margin: [0, 2] },
                { text: `Datum sačinjavanja: ${datumSacinjavanja}`, margin: [0, 2] },
                { text: `Datum nastanka poreske obaveze: ${datumNastankaObaveze}`, margin: [0, 2] },
                { text: '', margin: [0, 5] },
                { text: `Valuta: ${valuta}`, margin: [0, 2], fontSize: 12, bold: true, alignment: 'right' },
                { text: `Srednji kurs: ${srednjiKurs}`, margin: [0, 2], alignment: 'right' },
                { text: 'SAČINJAVALAC', style: 'subHeader' },
                { text: `Naziv: ${sacinjavalacNaziv}\nPoreski broj: ${sacinjavalacPoreskiBroj}\nAdresa: ${sacinjavalacAdresa}`, margin: [0, 5] },
                { text: 'ISPORUČILAC', style: 'subHeader' },
                { text: `Naziv: ${isporucilacNaziv}\nPoreski broj: ${isporucilacPoreskiBroj}\nAdresa: ${isporucilacAdresa}`, margin: [0, 5] },
                { text: '', margin: [0, 5] },
                { text: '', margin: [0, 5] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                        body: [
                            ['R.br', 'Opis', 'Cena u valuti', 'Srednji kurs', 'Cena u RSD', 'Poreska osnovica', 'Poreska stopa', 'Porez'],
                            ...tableRows
                        ]
                    },
                    layout: 'lightHorizontalLines'
                },
                { text: '', margin: [0, 10] },
                { text: `Ukupno poreska osnovica: ${ukupnoPoreskaOsnovica}`, margin: [0, 5], alignment: 'right', bold: true },
                { text: `Ukupno PDV: ${ukupnoPDV}`, margin: [0, 5], alignment: 'right', bold: true },
                { text: '', margin: [0, 10, 0, 10] },
                { text: '', margin: [0, 5, 0, 5] },
                { text: '', margin: [0, 5, 0, 5] },
                { text: 'Odgovorno lice', margin: [0, 5], alignment: 'right', bold: true },
                { text: sacinjavalacOdgovornoLice, margin: [0, 0, 0, 5], alignment: 'right' },
                { text: '', margin: [0, 5, 0, 5] },
                { text: '', margin: [0, 5, 0, 5] },
                { text: 'NAPOMENA:', alignment: 'left' },
                { text: 'Interni račun je sastavljen u skladu sa članom 196.', alignment: 'left' },
                { text: 'Pravilnika o porezu na dodatu vrednost', alignment: 'left' },
                { text: '', margin: [0, 5, 0, 5] },
                { text: '', margin: [0, 5, 0, 5] },
                { text: 'Generisao sistem: Interni Obračun PDV', style: 'footer' },
                { text: 'Licence by Konfirs d.o.o. Beograd', style: 'footer'}
            ],
            styles: {
                header: { fontSize: 16, bold: true, alignment: 'center' },
                subHeader: { fontSize: 12, bold: true, margin: [0, 10, 0, 5] },
                footer: { fontSize: 10, italics: true, alignment: 'center' },
                boldRow: { fontSize: 12, bold: true, alignment: 'center' },
                italicRow: { fontSize: 12, italics: true, alignment: 'center' }
            },
            defaultStyle: {
                fontSize: 10
            }
        };

        // Generate and download the PDF
        pdfMake.createPdf(docDefinition).download('interni-obracun-pdv.pdf');
    }

    const button = document.querySelector(".generatePDF");
    if (button) {
        button.addEventListener("click", generatePDF);
        console.log("Button event listener attached successfully."); // Debugging log
    } else {
        console.error("Generate PDF button not found. Please check the class or ID selector.");
    }
});
