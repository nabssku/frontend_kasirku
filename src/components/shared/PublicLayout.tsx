import { Outlet } from 'react-router-dom';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';

export const PublicLayout = () => {

    return (
        <div className="w-full min-w-full h-full overflow-y-auto bg-[#fdfdfd] selection:bg-amber-100 selection:text-amber-900 font-sans" style={{ scrollBehavior: 'smooth' }}>
            {/* Navbar */}
            <PublicNavbar />

            <main className="pt-[72px] min-h-[calc(100vh-300px)]">
                <Outlet />
            </main>

            {/* Footer */}
            <PublicFooter />
        </div>
    );
};
