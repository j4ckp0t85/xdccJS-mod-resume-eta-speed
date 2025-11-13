# Miglioramenti per la Funzionalità Resume di xdccJS

## Problemi Identificati

### 1. Progress Bar durante Resume (downloader.ts:189-196)
**Problema**: Leggi l'intero file per inizializzare la progress bar, causando:
- Lettura sincrona di file potenzialmente grandi
- Calcolo ETA e velocità incorretti
- Performance degradate

**Soluzione**:
```typescript
if (fileInfo.position && fileInfo.position > 0) {
  candidate.timeout.clear();
  if (bar) {
    // Inizializza correttamente la progress bar
    bar.curr = fileInfo.position;
    // Stima il tempo di inizio basato sui byte già scaricati
    const estimatedStartTime = Date.now() - (fileInfo.position / (1024 * 100));
    bar.start = new Date(estimatedStartTime);
  }
}
```

### 2. Calcolo Posizione File (ctcp_parser.ts:147)
**Problema**: La posizione viene calcolata come dimensione esatta del file
**Rischio**: Possibili problemi con file corrotti o incompleti

**Soluzione**:
```typescript
private checkExistingFiles(fileInfo: FileInfo, candidate: Job, resp: { [prop: string]: string }): boolean {
  if (fs.existsSync(fileInfo.filePath) && this.path) {
    const stats = fs.statSync(fileInfo.filePath);
    fileInfo.position = stats.size;
    
    // Verifica integrità: se il file è più grande del previsto, ricomincia
    if (fileInfo.position >= fileInfo.length) {
      fs.unlinkSync(fileInfo.filePath);
      return false;
    }
    
    // Sicurezza: non riprendere se il file è troppo piccolo (possibile corruzione)
    if (fileInfo.position < 1024 && fileInfo.length > 1024) {
      fileInfo.position = 0;
    }
    
    const quotedFilename = CtcpParser.fileNameWithQuotes(fileInfo.file);
    this.ctcpRequest(resp.nick, 'DCC RESUME', quotedFilename, fileInfo.port, fileInfo.position);
    this.addToResumeQueue(fileInfo, resp.nick);
    this.emit('debug', 'xdccJS:: BEFORE_TCP_REQUEST_RESUME');
    return true;
  }
  return false;
}
```

### 3. Gestione Timeout durante Resume (ctcp_parser.ts:119-122)
**Problema**: Il timeout viene cancellato ma non reimpostato correttamente
**Rischio**: Download bloccati senza timeout

**Soluzione**:
```typescript
if (isResuming) {
  candidate.timeout.clear();
  // Reimposta timeout per la connessione di resume
  this.SetupTimeout({
    candidate,
    eventType: 'error',
    message: `couldn't resume download of %cyan%${fileInfo.file}`,
    padding: 6,
    delay: this.timeout,
    fileInfo,
  });
  return { fileInfo, candidate };
}
```

### 4. Miglioramento Progress Bar (lib/progress/index.js)
**Problema**: ETA e velocità non accurati durante resume

**Soluzione**: Aggiungere metodo per reset statistiche
```javascript
ProgressBar.prototype.resetForResume = function(resumePosition, estimatedElapsed) {
  this.curr = resumePosition;
  this.start = new Date(Date.now() - estimatedElapsed);
  this.lastRender = -Infinity;
}
```

## Correzioni Aggiuntive

### 5. Validazione File Resume
```typescript
private validateResumeFile(fileInfo: FileInfo): boolean {
  if (!fs.existsSync(fileInfo.filePath)) return false;
  
  const stats = fs.statSync(fileInfo.filePath);
  
  // File troppo grande
  if (stats.size >= fileInfo.length) return false;
  
  // File troppo piccolo per essere valido
  if (stats.size < 512 && fileInfo.length > 1024) return false;
  
  return true;
}
```

### 6. Gestione Errori Resume
```typescript
private handleResumeError(fileInfo: FileInfo, candidate: Job): void {
  this.print(`%danger% Resume failed for %cyan%${fileInfo.file}%reset%, restarting download`, 6);
  
  // Rimuovi file parziale
  if (fs.existsSync(fileInfo.filePath)) {
    fs.unlinkSync(fileInfo.filePath);
  }
  
  // Reset posizione e riavvia download
  fileInfo.position = 0;
  this.download(candidate.nick, candidate.now);
}
```

## Raccomandazioni Implementazione

1. **Test Resume**: Implementa test per verificare resume con file di diverse dimensioni
2. **Logging**: Aggiungi log dettagliati per debug resume
3. **Configurazione**: Aggiungi opzione per disabilitare resume se necessario
4. **Validazione**: Implementa checksum per verificare integrità file parziali
5. **Performance**: Evita operazioni sincrone su file grandi

## Priorità Implementazione

1. **Alta**: Fix progress bar e calcolo ETA
2. **Alta**: Validazione dimensione file
3. **Media**: Gestione timeout resume
4. **Media**: Validazione integrità file
5. **Bassa**: Configurazione opzionale resume
