document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu functionality (same as other pages)
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.querySelector('.main-nav');
    const uploadArea = document.getElementById('uploadArea');
    const pdfInput = document.getElementById('pdfInput');
    const splitOptions = document.getElementById('splitOptions');
    const pdfPreview = document.getElementById('pdfPreview');
    const splitBtn = document.getElementById('splitBtn');
    const conversionStatus = document.getElementById('conversionStatus');
    const downloadSection = document.getElementById('downloadSection');
    const pageRanges = document.getElementById('pageRanges');
    const rangeInput = document.getElementById('rangeInput');

    let selectedFile = null;
    let totalPages = 0;

    const handleFile = async (file) => {
        if (file.type === 'application/pdf') {
            selectedFile = file;
            splitOptions.style.display = 'block';
            
            try {
                // Load PDF and show preview
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                totalPages = pdf.getPageCount();

                // Show preview of first page
                pdfPreview.innerHTML = `
                    <div class="pdf-info">
                        <h4>${file.name}</h4>
                        <p>Total pages: ${totalPages}</p>
                    </div>
                `;

                splitBtn.disabled = false;
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

    // Split method radio buttons
    document.querySelectorAll('input[name="splitMethod"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            rangeInput.style.display = e.target.value === 'range' ? 'block' : 'none';
        });
    });

    // Split button click handler
    splitBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        try {
            splitBtn.disabled = true;
            splitBtn.classList.add('loading');
            conversionStatus.textContent = 'Splitting PDF...';
            downloadSection.innerHTML = '';
            downloadSection.style.display = 'none';

            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
            const splitMethod = document.querySelector('input[name="splitMethod"]:checked').value;

            if (splitMethod === 'single') {
                // Split into individual pages
                for (let i = 0; i < totalPages; i++) {
                    const newPdf = await PDFLib.PDFDocument.create();
                    const [page] = await newPdf.copyPages(pdf, [i]);
                    newPdf.addPage(page);
                    
                    const pdfBytes = await newPdf.save();
                    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);

                    addDownloadButton(url, `page_${i + 1}.pdf`);
                }
            } else {
                // Split by ranges
                const ranges = pageRanges.value.split(',')
                    .map(range => range.trim())
                    .filter(range => range)
                    .map(range => {
                        const [start, end] = range.split('-').map(num => parseInt(num) - 1);
                        return end ? { start, end } : { start, end: start };
                    });

                for (let i = 0; i < ranges.length; i++) {
                    const { start, end } = ranges[i];
                    const newPdf = await PDFLib.PDFDocument.create();
                    const pages = await newPdf.copyPages(pdf, 
                        Array.from({ length: end - start + 1 }, (_, i) => start + i));
                    pages.forEach(page => newPdf.addPage(page));
                    
                    const pdfBytes = await newPdf.save();
                    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);

                    addDownloadButton(url, `split_${start + 1}-${end + 1}.pdf`);
                }
            }

            conversionStatus.textContent = 'PDF split successfully!';
            downloadSection.style.display = 'block';
        } catch (error) {
            conversionStatus.textContent = 'Splitting failed. Please try again.';
            console.error('Error:', error);
        } finally {
            splitBtn.disabled = false;
            splitBtn.classList.remove('loading');
        }
    });

    function addDownloadButton(url, filename) {
        const button = document.createElement('button');
        button.className = 'download-button';
        button.innerHTML = `
            <span class="download-icon">⬇️</span>
            Download ${filename}
        `;
        button.onclick = () => {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
        };
        downloadSection.appendChild(button);
    }
}); 