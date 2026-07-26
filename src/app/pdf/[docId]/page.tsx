import React from 'react';
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

export default async function DocumentoPdfPage({ params }: { params: Promise<{ docId: string }> }) {
  const paramsResolved = await params;
  const docId = parseInt(paramsResolved.docId);

  const documento = await prisma.documentoInterno.findUnique({
    where: { id: docId },
    include: {
      autor: { select: { nombres: true, apellidos: true, rol: { select: { nombre: true } } } },
      expediente: { select: { codigo: true, asunto: true } }
    }
  });

  if (!documento) {
    notFound();
  }

  // Si no está firmado, advertimos visualmente en el documento (Watermark)
  const isBorrador = documento.estadoAprobacion !== 'FIRMADO';

  return (
    <div style={{ backgroundColor: "#525659", minHeight: "100vh", display: "flex", justifyContent: "center", padding: "2rem" }}>
      
      {/* Botón Flotante para Imprimir (No visible en la impresión) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; padding: 0; }
          .page-a4 { box-shadow: none !important; margin: 0 !important; }
        }
      `}} />

      <PrintButton />

      {/* Hoja A4 */}
      <div 
        className="page-a4"
        style={{
          backgroundColor: "white",
          width: "210mm",
          minHeight: "297mm",
          padding: "20mm",
          boxShadow: "0 0 10px rgba(0,0,0,0.5)",
          position: "relative",
          fontFamily: "'Times New Roman', serif"
        }}
      >
        {isBorrador && (
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-45deg)",
            fontSize: "8rem", color: "rgba(255, 0, 0, 0.1)", fontWeight: "bold", pointerEvents: "none", zIndex: 0
          }}>
            NO VÁLIDO
          </div>
        )}

        {/* Encabezado */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid black", paddingBottom: "10px", marginBottom: "20px", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <h1 style={{ fontSize: "1.2rem", margin: 0, textTransform: "uppercase" }}>Municipalidad Provincial de Chupaca</h1>
            <h2 style={{ fontSize: "1rem", margin: "5px 0 0 0", color: "#444" }}>"Año del Bicentenario, de la consolidación de nuestra Independencia..."</h2>
          </div>
        </div>

        {/* Info del Documento */}
        <div style={{ marginBottom: "30px", position: "relative", zIndex: 1 }}>
          <p style={{ margin: "5px 0", fontSize: "12pt" }}><strong>TIPO DE DOCUMENTO:</strong> {documento.tipo}</p>
          <p style={{ margin: "5px 0", fontSize: "12pt" }}><strong>EXPEDIENTE REFERENCIA:</strong> {documento.expediente.codigo}</p>
          <p style={{ margin: "5px 0", fontSize: "12pt" }}><strong>ASUNTO:</strong> {documento.expediente.asunto}</p>
          <p style={{ margin: "5px 0", fontSize: "12pt" }}><strong>FECHA:</strong> {new Date(documento.creadoEn).toLocaleDateString("es-PE")}</p>
        </div>

        {/* Contenido (Rich Text) */}
        <div 
          style={{ fontSize: "12pt", lineHeight: "1.6", position: "relative", zIndex: 1 }}
          dangerouslySetInnerHTML={{ __html: documento.contenido }}
        />
        
      </div>
    </div>
  );
}
