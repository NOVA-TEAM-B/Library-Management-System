import React, { useState, useEffect } from 'react';
import { Building } from 'lucide-react';

interface BrandLogoProps {
  className?: string;
  imgClassName?: string;
  subdomain?: string;
  showName?: boolean;
  nameClassName?: string;
}

export default function BrandLogo({
  className = "flex items-center gap-2",
  imgClassName = "w-8 h-8 rounded-lg object-contain bg-white/5 border border-white/10 p-0.5",
  subdomain,
  showName = false,
  nameClassName = "text-xs font-extrabold text-white uppercase tracking-wider font-mono"
}: BrandLogoProps) {
  const [logoUrl, setLogoUrl] = useState('/logo.png');
  const [orgName, setOrgName] = useState('Nova Library');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // 1. If subdomain prop is specified, fetch from public branding API
    if (subdomain && subdomain !== 'localhost' && subdomain !== '127.0.0.1') {
      fetch(`http://127.0.0.1:5000/api/auth/organization-branding?subdomain=${subdomain}`)
        .then(res => res.json())
        .then(data => {
          if (data.logo_url) setLogoUrl(`http://127.0.0.1:5000${data.logo_url}`);
          if (data.name) setOrgName(data.name);
        })
        .catch(err => console.error("Branding loading error:", err));
      return;
    }

    // 2. Fallback to localStorage session parameters
    const storedUser = localStorage.getItem('nova_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.org_logo) {
          // Prepend server host if it's a relative path
          const fullLogoUrl = parsed.org_logo.startsWith('http') 
            ? parsed.org_logo 
            : `http://127.0.0.1:5000${parsed.org_logo}`;
          setLogoUrl(fullLogoUrl);
        }
        if (parsed.org_name) {
          setOrgName(parsed.org_name);
        }
      } catch (e) {
        console.error("Failed to parse stored user branding:", e);
      }
    }
  }, [subdomain]);

  return (
    <div className={className}>
      {!imgError && logoUrl ? (
        <img 
          src={logoUrl} 
          className={imgClassName} 
          alt={`${orgName} Logo`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={`${imgClassName} flex items-center justify-center text-cyan-400`}>
          <Building className="w-4 h-4" />
        </div>
      )}
      {showName && (
        <span className={nameClassName}>
          {orgName}
        </span>
      )}
    </div>
  );
}
