import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: string;
}

export const SEO = ({
    title = 'JagoKasir- Smart POS Solution untuk Bisnis Modern',
    description = 'Kelola bisnis retail dan F&B Anda dengan mudah menggunakan JagoKasir. Aplikasi kasir online tercepat, termudah, dan terlengkap.',
    keywords = 'aplikasi kasir, pos system, point of sale, kasir online, inventory management, retail pos, f&b pos, JagoKasir',
    image = '/og-image2.png',
    url = 'https://jagokasir.store',
    type = 'website',
}: SEOProps) => {
    const siteTitle = title.includes('JagoKasir') ? title : `${title} | JagoKasir`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
};
