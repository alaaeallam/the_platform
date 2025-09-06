
import Header from '@/components/header'
import React, { ReactNode } from 'react'

export default function Layout({children}:{children:ReactNode}){
    return <div>
        <Header/>
        {children}
    
        </div>
}