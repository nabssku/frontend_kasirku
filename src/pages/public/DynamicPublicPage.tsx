import { useLocation } from 'react-router-dom';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { SEO } from '../../components/SEO';
import { BlockRenderer } from '../../components/shared/BlockRenderer';

interface DynamicPublicPageProps {
    settingKey?: string;
}

export default function DynamicPublicPage({ settingKey: propKey }: DynamicPublicPageProps) {
    const location = useLocation();

    // Determine key from path if not provided as prop
    const getKeyFromPath = () => {
        const path = location.pathname.replace('/', '');
        switch (path) {
            case 'help-center': return 'page_help_center';
            case 'contact': return 'page_contact';
            case 'privacy-policy': return 'page_privacy_policy';
            case 'terms-conditions': return 'page_terms_conditions';
            default: return propKey || 'page_help_center';
        }
    };

    const key = getKeyFromPath();
    const { data: settings, isLoading } = useSystemSettings([key]);
    const pageData = settings?.[key];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-400"></div>
            </div>
        );
    }

    if (!pageData) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <h1 className="text-3xl font-bold text-slate-800">Halaman tidak ditemukan</h1>
                <p className="text-slate-500 mt-4">Maaf, halaman yang Anda cari tidak tersedia saat ini.</p>
            </div>
        );
    }

    return (
        <div className="w-full min-w-full pt-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SEO
                title={pageData.title + ' - JagoKasir'}
                description={pageData.title + ' JagoKasir POS'}
            />

            <BlockRenderer blocks={pageData.blocks} />
        </div>
    );
}
