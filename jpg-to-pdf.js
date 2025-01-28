document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const conversionOptions = document.getElementById('conversionOptions');
    const imagesList = document.getElementById('imagesList');
    const imagesGrid = document.getElementById('imagesGrid');
    const addMoreBtn = document.getElementById('addMoreBtn');
    const convertBtn = document.getElementById('convertBtn');
    const conversionStatus = document.getElementById('conversionStatus');
    const downloadSection = document.getElementById('downloadSection');
    const downloadBtn = document.getElementById('downloadBtn');

    let selectedFiles = [];

    const handleFiles = (files) => {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                selectedFiles.push(file);
                addImageToGrid(file);
            } else {
                alert('Please select only image files');
            }
        });

        if (selectedFiles.length > 0) {
            conversionOptions.style.display = 'block';
            convertBtn.disabled = false;
        }
    };

    const addImageToGrid = async (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <div class="image-info">
                    <span class="image-name">${file.name}</span>
                    <span class="image-size">${formatFileSize(file.size)}</span>
                </div>
                <button class="remove-image" data-name="${file.name}">×</button>
            `;
            imagesGrid.appendChild(imageItem);

            // Add remove functionality
            imageItem.querySelector('.remove-image').addEventListener('click', (e) => {
                const fileName = e.target.dataset.name;
                selectedFiles = selectedFiles.filter(f => f.name !== fileName);
                imageItem.remove();
                if (selectedFiles.length === 0) {
                    conversionOptions.style.display = 'none';
                    convertBtn.disabled = true;
                }
            });
        };
        reader.readAsDataURL(file);
    };

    // Upload area event listeners
    uploadArea.addEventListener('click', () => imageInput.click());
    addMoreBtn.addEventListener('click', () => imageInput.click());
    
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

    imageInput.addEventListener('change', () => handleFiles(imageInput.files));

    // Convert button click handler
    convertBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        try {
            convertBtn.disabled = true;
            convertBtn.classList.add('loading');
            conversionStatus.textContent = 'Converting images to PDF...';
            downloadSection.style.display = 'none';

            const pageSize = document.getElementById('pageSize').value;
            const orientation = document.getElementById('orientation').value;
            const quality = document.getElementById('quality').value;
            const margins = document.getElementById('margins').value;

            // Create a new PDF document
            const pdfDoc = await PDFLib.PDFDocument.create();

            // Process each image
            for (const file of selectedFiles) {
                const imageBytes = await file.arrayBuffer();
                let image;
                
                if (file.type === 'image/jpeg') {
                    image = await pdfDoc.embedJpg(imageBytes);
                } else if (file.type === 'image/png') {
                    image = await pdfDoc.embedPng(imageBytes);
                }

                // Calculate page dimensions
                let pageWidth = 595.28; // A4 width in points
                let pageHeight = 841.89; // A4 height in points

                if (pageSize === 'letter') {
                    pageWidth = 612; // Letter width in points
                    pageHeight = 792; // Letter height in points
                } else if (pageSize === 'fit') {
                    pageWidth = image.width;
                    pageHeight = image.height;
                }

                // Auto-detect orientation if needed
                if (orientation === 'auto') {
                    if (image.width > image.height) {
                        [pageWidth, pageHeight] = [pageHeight, pageWidth];
                    }
                } else if (orientation === 'landscape') {
                    [pageWidth, pageHeight] = [pageHeight, pageWidth];
                }

                // Calculate margins
                const marginSize = margins === 'none' ? 0 : 
                                 margins === 'small' ? 28.35 : // 10mm in points
                                 72; // 25.4mm in points

                const page = pdfDoc.addPage([pageWidth, pageHeight]);
                const { width, height } = page.getSize();
                const imageWidth = width - (2 * marginSize);
                const imageHeight = height - (2 * marginSize);

                // Calculate scaling to fit within margins while maintaining aspect ratio
                const scale = Math.min(
                    imageWidth / image.width,
                    imageHeight / image.height
                );

                const scaledWidth = image.width * scale;
                const scaledHeight = image.height * scale;

                // Center the image on the page
                const x = (width - scaledWidth) / 2;
                const y = (height - scaledHeight) / 2;

                page.drawImage(image, {
                    x,
                    y,
                    width: scaledWidth,
                    height: scaledHeight
                });
            }

            // Generate PDF file
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            // Setup download button
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = url;
                link.download = 'converted.pdf';
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