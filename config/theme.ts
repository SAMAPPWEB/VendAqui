export const theme = {
    colors: {
        primary: '#F97316', // Laranja Principal
        secondary: '#191919', // Cinza Escuro (Solicitado)
        background: '#F3F4F6', // Cinza Claro (Atual)
        surface: '#FFFFFF', // Branco
        text: {
            primary: '#111827',
            secondary: '#4B5563',
            inverted: '#FFFFFF',
            highlight: '#F97316'
        },
        status: {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        }
    },
    typography: {
        fontFamily: {
            sans: '"Inter", system-ui, -apple-system, sans-serif',
            mono: '"JetBrains Mono", monospace'
        },
        sizes: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem'
        }
    },
    spacing: {
        container: {
            padding: '1.5rem',
            maxWidth: '1280px'
        },
        box: {
            padding: '1.25rem',
            gap: '1rem',
            borderRadius: '1rem'
        }
    },
    borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '1rem',
        full: '9999px'
    },
    shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
    }
};

export const containerStyle = "max-w-[1280px] mx-auto px-6 w-full";
export const boxStyle = "bg-white rounded-2xl shadow-sm border border-gray-100 p-5";
export const cardStyle = "bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300";
export const primaryButtonStyle = "bg-[#F97316] text-white font-bold py-2.5 px-4 rounded-xl hover:bg-[#EA580C] active:scale-95 transition-all shadow-sm shadow-orange-200";
export const secondaryButtonStyle = "bg-[#191919] text-white font-bold py-2.5 px-4 rounded-xl hover:bg-gray-800 active:scale-95 transition-all shadow-sm";
