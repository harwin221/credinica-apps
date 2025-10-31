'use client';

import Link from 'next/link'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileQuestion, ArrowLeft } from 'lucide-react';
 
export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md shadow-lg text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
            <FileQuestion className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4 text-3xl font-bold">404 - Página No Encontrada</CardTitle>
          <CardDescription>
            Lo sentimos, no pudimos encontrar la página que estás buscando.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-6">
            Puede que la página haya sido movida, eliminada, o que la dirección sea incorrecta.
          </p>
          <Button asChild>
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a la Página Principal
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
