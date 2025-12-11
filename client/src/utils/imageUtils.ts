const IMAGE_BASE_URL = '/storage/';
const DEFAULT_IMAGE_FILENAME = 'product_images/default-product.svg';

export const getProductImageUrl = (imagePath: string | null | undefined): string => {
    if (imagePath && imagePath.trim() !== '') {
        if (imagePath.startsWith('/')) {
            return imagePath; 
        }
        return `${IMAGE_BASE_URL}${imagePath}`;
    }
    return `${IMAGE_BASE_URL}${DEFAULT_IMAGE_FILENAME}`;
};