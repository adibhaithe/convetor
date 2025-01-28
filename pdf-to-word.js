document.addEventListener('DOMContentLoaded', () => {
    // Initialize PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const uploadArea = document.getElementById('uploadArea');
    const pdfInput = document.getElementById('pdfInput');
    const conversionOptions = document.getElementById('conversionOptions');
    const pdfPreview = document.getElementById('pdfPreview');
    const convertBtn = document.getElementById('convertBtn');
    const conversionStatus = document.getElementById('conversionStatus');
    const downloadSection = document.getElementById('downloadSection');
    const conversionResult = document.getElementById('conversionResult');
    const downloadBtn = document.getElementById('downloadBtn');
    const pageRange = document.getElementById('pageRange');

    let pdfDocument = null;
    let totalPages = 0;

    // Handle page selection radio buttons
    document.querySelectorAll('input[name="pageSelection"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            pageRange.disabled = e.target.value === 'all';
        });
    });

    const handleFile = async (file) => {
        if (file.type === 'application/pdf') {
            try {
                const arrayBuffer = await file.arrayBuffer();
                pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                totalPages = pdfDocument.numPages;

                // Show preview of first page
                const page = await pdfDocument.getPage(1);
                const viewport = page.getViewport({ scale: 0.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                pdfPreview.innerHTML = `
                    <div class="pdf-info">
                        <h4>${file.name}</h4>
                        <p>Total pages: ${totalPages}</p>
                    </div>
                    <img src="${canvas.toDataURL()}" alt="First page preview">
                `;

                conversionOptions.style.display = 'block';
                convertBtn.disabled = false;
            } catch (error) {
                console.error('Error loading PDF:', error);
                alert('Error loading PDF file');
            }
        } else {
            alert('Please select a PDF file');
        }
    };

    // Upload area event listeners
    uploadArea.addEventListener('click', () => pdfInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#e74c3c';
        uploadArea.style.background = '#fff9f9';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ccc';
        uploadArea.style.background = 'white';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ccc';
        uploadArea.style.background = 'white';
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    pdfInput.addEventListener('change', () => {
        if (pdfInput.files.length > 0) {
            handleFile(pdfInput.files[0]);
        }
    });

    // Convert button click handler
    convertBtn.addEventListener('click', async () => {
        if (!pdfDocument) return;

        try {
            convertBtn.disabled = true;
            convertBtn.classList.add('loading');
            conversionStatus.textContent = 'Converting PDF to Word...';
            downloadSection.style.display = 'none';

            const outputFormat = document.getElementById('outputFormat').value;
            const pageSelection = document.querySelector('input[name="pageSelection"]:checked').value;
            
            let pagesToConvert = [];
            if (pageSelection === 'all') {
                pagesToConvert = Array.from({ length: totalPages }, (_, i) => i + 1);
            } else {
                // Parse page range
                pagesToConvert = pageRange.value.split(',')
                    .map(range => range.trim())
                    .flatMap(range => {
                        const [start, end] = range.split('-').map(num => parseInt(num));
                        return end 
                            ? Array.from({ length: end - start + 1 }, (_, i) => start + i)
                            : [start];
                    });
            }

            // Create a new Word document
            const doc = new docx.Document({
                sections: [{
                    properties: {},
                    children: []
                }]
            });

            // Extract text from selected pages
            for (const pageNum of pagesToConvert) {
                const page = await pdfDocument.getPage(pageNum);
                const textContent = await page.getTextContent();
                const text = textContent.items.map(item => item.str).join(' ');

                // Add text to Word document
                doc.addSection({
                    properties: {},
                    children: [
                        new docx.Paragraph({
                            children: [new docx.TextRun(text)]
                        })
                    ]
                });
            }

            // Generate document
            const buffer = await docx.Packer.toBlob(doc);
            const url = URL.createObjectURL(buffer);

            // Show conversion results
            conversionResult.innerHTML = `
                <div class="conversion-info">
                    <h4>Conversion Complete!</h4>
                    <p>Document is ready for download</p>
                </div>
            `;

            // Setup download button
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = url;
                link.download = `converted.${outputFormat}`;
                link.click();
            };

            conversionStatus.textContent = 'Conversion successful!';
            downloadSection.style.display = 'block';
        } catch (error) {
            conversionStatus.textContent = 'Conversion failed. Please try again.';
            console.error('Error:', error);
        } finally {
            convertBtn.disabled = false;
            convertBtn.classList.remove('loading');
        }
    });

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 