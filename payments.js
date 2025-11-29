// Логика оплат и Drag & Drop
class PaymentsManager {
    constructor() {
        this.currentFile = null;
        this.currentPaymentType = null;
        this.currentSubscription = null;
        this.init();
    }

    init() {
        this.setupFileUpload('fileInput', 'uploadArea', 'filePreview', 'previewImage', 'fileName', 'fileSize', 'submitPaymentBtn');
        this.setupFileUpload('fileInputSbp', 'uploadAreaSbp', 'filePreviewSbp', 'previewImageSbp', 'fileNameSbp', 'fileSizeSbp', 'submitSbpBtn');
        console.log('PaymentsManager инициализирован');
    }

    // Настройка Drag & Drop для загрузки файлов
    setupFileUpload(inputId, areaId, previewId, imageId, nameId, sizeId, submitBtnId) {
        const fileInput = document.getElementById(inputId);
        const uploadArea = document.getElementById(areaId);
        const filePreview = document.getElementById(previewId);
        const previewImage = document.getElementById(imageId);
        const fileName = document.getElementById(nameId);
        const fileSize = document.getElementById(sizeId);
        const submitBtn = document.getElementById(submitBtnId);

        if (!fileInput || !uploadArea) return;

        // Клик по области открывает диалог выбора файла
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Обработка перетаскивания файлов
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0], fileInput, uploadArea, filePreview, previewImage, fileName, fileSize, submitBtn);
            }
        });

        // Обработка выбора файла через диалог
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0], fileInput, uploadArea, filePreview, previewImage, fileName, fileSize, submitBtn);
            }
        });
    }

    // Обработка выбранного файла
    handleFileSelect(file, fileInput, uploadArea, filePreview, previewImage, fileName, fileSize, submitBtn) {
        // Проверка типа файла
        if (!file.type.startsWith('image/')) {
            this.showNotification('Пожалуйста, выберите изображение (JPG, PNG)', 'error');
            return;
        }

        // Проверка размера
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Файл слишком большой. Максимум 5MB', 'error');
            return;
        }

        this.currentFile = file;

        // Показываем превью
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            fileName.textContent = file.name;
            fileSize.textContent = this.formatFileSize(file.size);

            uploadArea.style.display = 'none';
            filePreview.style.display = 'flex';

            // Активируем кнопку отправки
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        };
        reader.readAsDataURL(file);
    }

    // Удаление файла
    removeFile(type = 'yoomoney') {
        const elements = this.getUploadElements(type);
        if (!elements) return;

        const { fileInput, uploadArea, filePreview, submitBtn } = elements;

        fileInput.value = '';
        this.currentFile = null;

        uploadArea.style.display = 'block';
        filePreview.style.display = 'none';

        if (submitBtn) {
            submitBtn.disabled = true;
        }
    }

    // Получение элементов для типа оплаты
    getUploadElements(type) {
        if (type === 'yoomoney') {
            return {
                fileInput: document.getElementById('fileInput'),
                uploadArea: document.getElementById('uploadArea'),
                filePreview: document.getElementById('filePreview'),
                submitBtn: document.getElementById('submitPaymentBtn')
            };
        } else if (type === 'sbp') {
            return {
                fileInput: document.getElementById('fileInputSbp'),
                uploadArea: document.getElementById('uploadAreaSbp'),
                filePreview: document.getElementById('filePreviewSbp'),
                submitBtn: document.getElementById('submitSbpBtn')
            };
        }
        return null;
    }

    // Форматирование размера файла
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Конвертация файла в base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Показ уведомлений
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Возможность закрыть кликом
        notification.addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Создаем глобальный экземпляр
window.PaymentsManager = new PaymentsManager();
