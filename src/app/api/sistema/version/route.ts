import { NextResponse } from "next/server";
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    // Leer el package.json para obtener la versión real desplegada
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonData);

    const versionData = {
      success: true,
      data: {
        name: packageJson.name || "plataforma-web-devops",
        version: packageJson.version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(versionData);
  } catch (error) {
    console.error("Error al obtener la versión del sistema:", error);
    
    // Fallback seguro en caso de error de lectura
    return NextResponse.json({ 
      success: true, 
      data: { 
        name: "plataforma-web-devops", 
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString()
      } 
    });
  }
}
