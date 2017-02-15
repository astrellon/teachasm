;(function()
{
    let tokenRegex = /;(.+)|[^\s"']+|"([^"]*)"|'([^']*)'/g;

    let TokenOpCode = 'opcode';
    let TokenRegister = 'register';
    let TokenPointer = 'pointer';
    let TokenValuePointer = 'value_pointer';
    let TokenInt = 'int';
    let TokenByte = 'byte';
    let TokenString = 'string';
    let TokenLabel = 'label';
    let TokenComment = 'comment';

    let availableOpCodes = {};

    let opCodeMappings = {};
    function createKey(opcodeName, types)
    {
        return opcodeName + '-' + types.join('-');
    }
    function setMapping(opcode, opcodeName)
    {
        let types = Array.prototype.slice.call(arguments, 2);

        availableOpCodes[opcodeName] = true;
        let key = createKey(opcodeName, types);
        opCodeMappings[key] = opcode;
    }
    function getMapping(opcodeName, types)
    {
        let key = createKey(opcodeName, types)
        let result = opCodeMappings[key];
        if (!result)
        {
            throw new Error('Unknown opcode mapping: ', opcodeName, types);
        }

        return result;
    }

    function Token(type, value)
    {
        this.type = type;
        this.value = value;
    }

    function LineResult(bytes, label, labelIndex)
    {
        this.bytes = bytes;
        this.label = label;
        this.labelIndex = labelIndex;
    }

    function Assembler()
    {
        this.labels = {};
        this.labelBytePositions = {};
        this.labelReplaceLocations = {};
        this.processedLines = [];
        this.resultBuilder = [];
        this.finalResult = null;
    }

    Assembler.init = function()
    {
        let code = simpleCpu.opCodes;
        setMapping(code.moveRI, 'mov', TokenRegister, TokenInt);
        setMapping(code.moveRR, 'mov', TokenRegister, TokenRegister);
        
        setMapping(code.moveRP, 'mov', TokenRegister, TokenPointer);
        setMapping(code.movePR, 'mov', TokenPointer, TokenRegister);
        
        setMapping(code.moveRV, 'mov', TokenRegister, TokenValuePointer);
        setMapping(code.moveVR, 'mov', TokenValuePointer, TokenRegister);
        
        setMapping(code.moveRVI, 'mov', TokenRegister, TokenValuePointer, TokenInt);
        setMapping(code.moveVRI, 'mov', TokenValuePointer, TokenRegister, TokenInt);
        
        setMapping(code.moveRPI, 'mov', TokenRegister, TokenPointer, TokenInt);
        setMapping(code.movePRI, 'mov', TokenPointer, TokenRegister, TokenInt);
        
        setMapping(code.addRI, 'add', TokenRegister, TokenInt);
        setMapping(code.addRR, 'add', TokenRegister, TokenRegister);
        
        setMapping(code.subtractRI, 'sub', TokenRegister, TokenInt);
        setMapping(code.subtractRR, 'sub', TokenRegister, TokenRegister);
        
        setMapping(code.multiplyRI, 'mul', TokenRegister, TokenInt);
        setMapping(code.multiplyRR, 'mul', TokenRegister, TokenRegister);
        
        setMapping(code.divideRI, 'div', TokenRegister, TokenInt);
        setMapping(code.divideRR, 'div', TokenRegister, TokenRegister);

        setMapping(code.compareRI, 'cmp', TokenRegister, TokenInt);
        setMapping(code.compareRR, 'cmp', TokenRegister, TokenRegister);
        
        setMapping(code.jumpL, 'jmp', TokenLabel);
        setMapping(code.jumpEqualsL, 'jeq', TokenLabel);
        setMapping(code.jumpNotEqualsL, 'jneq', TokenLabel);
        setMapping(code.jumpLessThanL, 'jlt', TokenLabel);
        setMapping(code.jumpLessThanEqualL, 'jlte', TokenLabel);
        setMapping(code.jumpGreaterThanL, 'jgt', TokenLabel);
        setMapping(code.jumpGreaterThanEqualL, 'jgte', TokenLabel);
        
        setMapping(code.callL, 'call', TokenLabel);
        setMapping(code.returnV, 'return');
        
        setMapping(code.pushI, 'push', TokenInt);
        setMapping(code.pushR, 'push', TokenRegister);
        setMapping(code.popR, 'pop', TokenRegister);
        
        setMapping(code.stopV, 'stop');

        console.log('Mappings', opCodeMappings);
    }

    let fn = Assembler.prototype;

    fn.assemble = function(input)
    {
        this.processInputLines(input);
        this.assembleTokens();
        this.combineResult();
        this.postProcessLabels();

        console.log('Final: ', this.finalResult);
        return this.finalResult;
    }

    fn.processInputLines = function(input)
    {
        let split = input.split('\n');
        for (let i = 0; i < split.length; i++)
        {
            this.processLine(split[i], i);
        }
    }

    fn.processLine = function(line, lineNumber)
    {
        let trimmedLine = line.trim();
        if (trimmedLine.length === 0)
        {
            this.processedLines.push(null);
            return;
        }

        let tokens = trimmedLine.match(tokenRegex);
        console.log('Split tokens [', lineNumber, ']: ', tokens);

        let processedLine = [];
        for (let i = 0; i < tokens.length; i++)
        {
            processedLine.push(this.processToken(tokens[i], i === 0));
        }
        console.log('Tokens [', lineNumber, ']', processedLine);
        this.processedLines.push(processedLine)
    }

    fn.processToken = function(token, isFirstToken)
    {
        let lowerToken = token.toLowerCase();
        let hasOpCode = availableOpCodes[lowerToken];
        if (hasOpCode === true)
        {
            return new Token(TokenOpCode, lowerToken);
        }

        // eg: r0, r10
        if (lowerToken[0] === 'r')
        {
            return new Token(TokenRegister, parseInt(lowerToken.substr(1)));
        }
        // eg: @r2, @r13
        if (lowerToken[0] === '@' && lowerToken[1] === 'r')
        {
            return new Token(TokenPointer, parseInt(lowerToken.substr(2)));
        }
        if (lowerToken[0] === '@')
        {
            return new Token(TokenValuePointer, parseInt(lowerToken.substr(1)));
        }
        // eg: mov r0 5 ; This is a comment
        if (lowerToken[0] === ';')
        {
            return new Token(TokenComment, token);
        }

        let last = token[token.length - 1]; 
        // eg: start:, jmp start:
        if (last === ':')
        {
            return new Token(TokenLabel, token);
        }
        // eg: 5b, -10b == 246;
        if (last === 'b')
        {
            return new Token(TokenByte, processByte(lowerToken));
        }

        if (isFirstToken)
        {
            throw new Error('Unknown opcode: ' + token);
        }
        return new Token(TokenInt, parseInt(lowerToken));
    }

    function processByte(input)
    {
        let result = parseInt(input);
        if (result > 255 || result < -127)
        {
            throw new Error('Byte out of range ' + input);
        }
        if (result < 0)
        {
            result = 256 + result;
        }
        return result;
    }

    fn.assembleTokens = function()
    {
        for (let i = 0; i < this.processedLines.length; i++)
        {
            let line = this.processedLines[i];
            if (line == null)
            {
                continue;
            }

            let assembledLine = this.assembleTokenLine(line);
            if (assembledLine === null)
            {
                continue;
            }

            this.resultBuilder.push(assembledLine);
        }

        console.log("Result builder", this.resultBuilder, this.labels);
    }

    fn.combineResult = function()
    {
        let totalBytes = 0;
        for (let i = 0; i < this.resultBuilder.length; i++)
        {
            totalBytes += this.resultBuilder[i].bytes.length; 
        }

        this.finalResult = new Int8Array(totalBytes);
        let pos = 0;
        for (let i = 0; i < this.resultBuilder.length; i++)
        {
            if (this.labels[i])
            {
                this.labelBytePositions[this.labels[i]] = pos;
            }

            let resultLine = this.resultBuilder[i];
            if (resultLine.label)
            {
                this.addLabelReplaceLocation(resultLine.label, resultLine.labelIndex + pos);
            }

            let bytes = resultLine.bytes;
            for (let j = 0; j < bytes.length; j++)
            {
                this.finalResult[pos++] = bytes[j];
            }
        }

        if (this.labels[this.resultBuilder.length])
        {
            this.labelBytePositions[this.labels[this.resultBuilder.length]] = pos;
        }

        console.log('Label Byte Positions: ', this.labelBytePositions, this.labelReplaceLocations);
    }

    fn.addLabelReplaceLocation = function(label, index)
    {
        let locations = this.labelReplaceLocations[label];
        if (!locations)
        {
            locations = this.labelReplaceLocations[label] = [];
        }
        locations.push(index);
    }

    fn.postProcessLabels = function()
    {
        for (let label in this.labelReplaceLocations)
        {
            let labelIndex = this.labelBytePositions[label];
            let replaceIndices = this.labelReplaceLocations[label];

            for (let i = 0; i < replaceIndices.length; i++)
            {
                writeInt32(this.finalResult, replaceIndices[i], labelIndex);
            }
        }
    }

    fn.assembleTokenLine = function(line)
    {
        let type = line[0].type;
        if (type === TokenLabel)
        {
            //this.labels[line[0].value] = this.resultBuilder.length;
            this.labels[this.resultBuilder.length] = line[0].value;
            return null;
        }
        else if (type !== TokenOpCode)
        {
            throw new Error('Unexpected token: ' + type + ' = ' + line[0].value);
        }

        // Will be an opcode at this point
        return this.writeLineToArray(line);
    }

    fn.writeLineToArray = function(line)
    {
        let opcodeToken = line[0];
        let lineTypes = this.getTypesFromLine(line);

        let opcode = getMapping(opcodeToken.value, lineTypes);
        console.log('Opcode mapping: ', opcode, opcodeToken.value, lineTypes)

        let byteCount = this.countBytesRequired(lineTypes);
        // Plus one for opcode.
        byteCount += 1;

        let resultBytes = new Int8Array(byteCount);

        let labelFound = null;
        let labelIndex = -1;

        let position = writeInt8(resultBytes, 0, opcode);

        for (let i = 0; i < line.length; i++)
        {
            let token = line[i];
            let type = token.type;
            switch (type)
            {
                default:
                case TokenOpCode:
                    break;

                case TokenRegister:
                case TokenPointer:
                case TokenByte:
                    position = writeInt8(resultBytes, position, token.value);
                    break;

                case TokenLabel:
                    labelFound = token.value;
                    labelIndex = position;
                    position = writeInt32(resultBytes, position, 0);
                    break;

                case TokenInt:
                    position = writeInt32(resultBytes, position, token.value);
                    break;
            }
        }
        return new LineResult(resultBytes, labelFound, labelIndex);
    }
    fn.countBytesRequired = function(lineTypes)
    {
        let result = 0;
        for (let i = 0; i < lineTypes.length; i++)
        {
            let type = lineTypes[i];
            if (type === TokenInt ||
                type === TokenLabel)
            {
                result += 4;
            }
            else if (type === TokenRegister ||
                type === TokenPointer ||
                type === TokenByte)
            {
                result += 1;
            }
        }

        return result;
    }
    fn.getTypesFromLine = function(line)
    {
        let result = [];
        for (let i = 0; i < line.length; i++)
        {
            let token = line[i];
            if (token.type === TokenOpCode || 
                token.type === TokenComment)
            {
                continue;
            }
            result.push(token.type);
        }
        return result;
    }

    function writeInt8(array, index, value)
    {
        array[index] = value;
        return index + 1;
    }
    function writeInt16(array, index, value)
    {
        array[index] = (value >> 8) & 0xFF;
        array[index + 1] = value & 0xFF;
        return index + 2;
    }
    function writeInt32(array, index, value)
    {
        array[index] = value & 0xFF;
        array[index + 1] = (value >> 8) & 0xFF;
        array[index + 2] = (value >> 16) & 0xFF;
        array[index + 3] = (value >> 24) & 0xFF;
        return index + 4;
    }

    window.simpleCpuAssembler = Assembler;

})();
