document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu functionality (same as in script.js)
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.querySelector('.main-nav');
    const uploadArea = document.getElementById('uploadArea');
    const pdfInput = document.getElementById('pdfInput');
    const filesList = document.getElementById('filesList');
    const filesContainer = document.getElementById('filesContainer');
    const mergeBtn = document.getElementById('mergeBtn');
    const conversionStatus = document.getElementById('conversionStatus');
    const downloadSection = document.getElementById('downloadSection');
    const downloadBtn = document.getElementById('downloadBtn');

    // Store selected PDFs
    let selectedFiles = [];

    const handleFiles = (files) => {
        Array.from(files).forEach(file => {
            if (file.type === 'application/pdf') {
                selectedFiles.push(file);
                addFileToList(file);
            } else {
                alert('Please select only PDF files');
            }
        });

        if (selectedFiles.length > 0) {
            filesList.style.display = 'block';
            mergeBtn.disabled = false;
        }
    };

    const addFileToList = (file) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <span class="file-name">${file.name}</span>
                <span class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <button class="remove-file" data-name="${file.name}">×</button>
        `;
        filesContainer.appendChild(fileItem);

        // Add remove functionality
        fileItem.querySelector('.remove-file').addEventListener('click', (e) => {
            const fileName = e.target.dataset.name;
            selectedFiles = selectedFiles.filter(f => f.name !== fileName);
            fileItem.remove();
            if (selectedFiles.length === 0) {
                filesList.style.display = 'none';
                mergeBtn.disabled = true;
            }
        });
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
        handleFiles(e.dataTransfer.files);
    });

    pdfInput.addEventListener('change', () => handleFiles(pdfInput.files));

    // Merge button click handler
    mergeBtn.addEventListener('click', async () => {
        try {
            mergeBtn.disabled = true;
            mergeBtn.classList.add('loading');
            conversionStatus.textContent = 'Merging PDFs...';
            downloadSection.style.display = 'none';

            const mergedPdf = await PDFLib.PDFDocument.create();

            for (const file of selectedFiles) {
                const fileArrayBuffer = await file.arrayBuffer();
                const pdf = await PDFLib.PDFDocument.load(fileArrayBuffer);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            }

            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = url;
                link.download = 'merged.pdf';
                link.click();
            };

            conversionStatus.textContent = 'PDFs merged successfully!';
            downloadSection.style.display = 'block';
        } catch (error) {
            conversionStatus.textContent = 'Merging failed. Please try again.';
            console.error('Error:', error);
        } finally {
            mergeBtn.disabled = false;
            mergeBtn.classList.remove('loading');
        }
    });
}); 