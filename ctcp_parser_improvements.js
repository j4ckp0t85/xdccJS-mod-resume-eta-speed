"use strict";
// Miglioramenti per ctcp_parser.ts
checkExistingFiles(fileInfo, FileInfo, candidate, Job, resp, { [prop]: string, string });
boolean;
{
    if (fs.existsSync(fileInfo.filePath) && this.path) {
        const stats = fs.statSync(fileInfo.filePath);
        fileInfo.position = stats.size;
        // Verifica integrità: se il file è più grande del previsto, ricomincia
        if (fileInfo.position >= fileInfo.length) {
            this.print(`%info% File %cyan%${fileInfo.file}%reset% already complete or corrupted, restarting`, 6);
            fs.unlinkSync(fileInfo.filePath);
            return false;
        }
        // Sicurezza: non riprendere se il file è troppo piccolo (possibile corruzione)
        if (fileInfo.position < 1024 && fileInfo.length > 1024) {
            this.print(`%info% File %cyan%${fileInfo.file}%reset% too small, restarting from beginning`, 6);
            fileInfo.position = 0;
            fs.unlinkSync(fileInfo.filePath);
            return false;
        }
        this.print(`%info% Resuming %cyan%${fileInfo.file}%reset% from position ${fileInfo.position}`, 6);
        const quotedFilename = CtcpParser.fileNameWithQuotes(fileInfo.file);
        this.ctcpRequest(resp.nick, 'DCC RESUME', quotedFilename, fileInfo.port, fileInfo.position);
        this.addToResumeQueue(fileInfo, resp.nick);
        // Imposta timeout per il resume
        this.SetupTimeout({
            candidate,
            eventType: 'error',
            message: `couldn't resume download of %cyan%${fileInfo.file}`,
            padding: 6,
            delay: this.timeout,
            fileInfo,
        });
        this.emit('debug', 'xdccJS:: BEFORE_TCP_REQUEST_RESUME');
        return true;
    }
    return false;
}
validateResumeFile(fileInfo, FileInfo);
boolean;
{
    if (!fs.existsSync(fileInfo.filePath))
        return false;
    const stats = fs.statSync(fileInfo.filePath);
    // File troppo grande
    if (stats.size >= fileInfo.length) {
        this.emit('debug', `Resume validation failed: file too large (${stats.size} >= ${fileInfo.length})`);
        return false;
    }
    // File troppo piccolo per essere valido (meno di 512 bytes per file > 1KB)
    if (stats.size < 512 && fileInfo.length > 1024) {
        this.emit('debug', `Resume validation failed: file too small (${stats.size} bytes)`);
        return false;
    }
    return true;
}
checkBeforeDL(resp, { [prop]: string, string }, candidate, Job);
{
    fileInfo: FileInfo;
    candidate: Job;
}
 | undefined;
{
    const parsedVals = this.parseCtcp(resp.message, resp.nick);
    const fileInfo = parsedVals?.fileInfo;
    const isResuming = parsedVals?.isResuming;
    if (fileInfo && this.SecurityCheck(resp.nick, candidate)) {
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
        if (fileInfo.type === 'DCC SEND') {
            const fileExists = this.checkExistingFiles(fileInfo, candidate, resp);
            if (!fileExists) {
                // Imposta timeout normale per nuovo download
                this.SetupTimeout({
                    candidate,
                    eventType: 'error',
                    message: `couldn't connect to %yellow%${fileInfo.ip}:${fileInfo.port}`,
                    padding: 6,
                    delay: this.timeout,
                    fileInfo,
                });
                return { fileInfo, candidate };
            }
        }
    }
    return undefined;
}
