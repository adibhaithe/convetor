document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.querySelector('.main-nav');

    menuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
            mainNav.classList.remove('active');
        }
    });

    // Handle active states
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item, .dropdown-item').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
            // If in dropdown, also highlight parent
            const dropdownToggle = link.closest('.dropdown')?.querySelector('.dropdown-toggle');
            if (dropdownToggle) {
                dropdownToggle.classList.add('active');
            }
        }
    });

    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const previewArea = document.getElementById('imagePreview');
    const optionsPanel = document.querySelector('.options-panel');
    const convertBtn = document.getElementById('convertBtn');
    const conversionStatus = document.getElementById('conversionStatus');
    const downloadSection = document.getElementById('downloadSection');
    const downloadBtn = document.getElementById('downloadBtn');

    // Store selected images data
    let selectedImages = [];

    const handleFiles = (files) => {
        previewArea.innerHTML = '';
        selectedImages = [];
        let validFiles = 0;
        
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                validFiles++;
                const reader = new FileReader();
                reader.onload = (e) => {
                    const preview = document.createElement('img');
                    preview.src = e.target.result;
                    preview.alt = file.name;
                    preview.className = 'preview-image';
                    previewArea.appendChild(preview);
                    
                    // Store image data for conversion
                    selectedImages.push({
                        data: e.target.result,
                        name: file.name
                    });
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please select only image files');
            }
        });

        if (validFiles > 0) {
            optionsPanel.style.display = 'block';
            convertBtn.disabled = false;
        } else {
            optionsPanel.style.display = 'none';
            convertBtn.disabled = true;
        }
    };

    // Upload area event listeners
    uploadArea.addEventListener('click', () => imageInput.click());

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
        if (selectedImages.length === 0) {
            alert('Please select at least one image');
            return;
        }

        const options = {
            orientation: document.querySelector('input[name="orientation"]:checked').value,
            pageSize: document.getElementById('pageSize').value,
            margin: document.querySelector('input[name="margin"]:checked').value,
            merge: document.getElementById('mergeFiles').checked
        };

        // Show loading state
        convertBtn.disabled = true;
        convertBtn.classList.add('loading');
        conversionStatus.textContent = 'Converting images to PDF...';
        downloadSection.style.display = 'none';

        try {
            // Create PDF
            const pdf = new jspdf.jsPDF({
                orientation: options.orientation,
                unit: 'mm',
                format: options.pageSize === 'fit' ? [210, 297] : options.pageSize // default to A4 if fit
            });

            // Calculate margins
            const margins = {
                none: 0,
                small: 10,
                big: 20
            }[options.margin];

            // Process each image
            for (let i = 0; i < selectedImages.length; i++) {
                if (i > 0) {
                    pdf.addPage();
                }

                const img = selectedImages[i];
                
                // Create temporary image to get dimensions
                const tempImage = new Image();
                await new Promise((resolve) => {
                    tempImage.onload = resolve;
                    tempImage.src = img.data;
                });

                // Calculate dimensions to fit page with margins
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const maxWidth = pageWidth - (2 * margins);
                const maxHeight = pageHeight - (2 * margins);

                let imgWidth = tempImage.width;
                let imgHeight = tempImage.height;

                // Scale image to fit page
                if (imgWidth > maxWidth || imgHeight > maxHeight) {
                    const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
                    imgWidth *= ratio;
                    imgHeight *= ratio;
                }

                // Center image on page
                const x = (pageWidth - imgWidth) / 2;
                const y = (pageHeight - imgHeight) / 2;

                pdf.addImage(img.data, 'JPEG', x, y, imgWidth, imgHeight);
            }

            // Generate PDF blob
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);

            // Setup download button
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = 'converted.pdf';
                link.click();
            };

            // Show success state
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
}); 