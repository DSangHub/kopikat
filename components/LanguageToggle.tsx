"use client";

export default function LanguageToggle({locale,dark=false}:{locale:"en"|"es";dark?:boolean}){
  function change(next:"en"|"es"){
    document.cookie=`kopycat-language=${next};path=/;max-age=31536000;samesite=lax`;
    window.location.reload();
  }
  return <div className={`languageToggle${dark?" dark":""}`} aria-label={locale==="es"?"Seleccionar idioma":"Select language"}>
    <button className={locale==="en"?"active":""} onClick={()=>change("en")} aria-pressed={locale==="en"}>EN</button>
    <button className={locale==="es"?"active":""} onClick={()=>change("es")} aria-pressed={locale==="es"}>ES</button>
  </div>;
}
