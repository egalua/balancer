"use strict"

let parser = (function(){
    class BaseParser{ // базовый класс парсера
        _DEFAULT_WHITESPACE = ' \n\t\r'; // пробельные символы
        
        constructor(source){
            this.source = source; // исходная строка
            this._pos = 0; // указатель на первый символ неразобранной части исходной строки
        }
        get _pos(){ 
            return this.__pos;
        }
        set _pos(value){ 
            if(value >= this.source.length) this.__pos = -1;
            else if(value < 0 && value != -1) this.__pos = 0; 
            else this.__pos = value;
            
        }
        /**
         * Первый символ неразобранной части исходной строки
         */
        current(){ 
            return this.source[this._pos];
        }
        /**
         * Указатель достижения конца исходной строки
         */
        end(){ 
            if(this._pos < 0){
                return true;
            }
            return false;
        }
        /**
         * Переход к следующему символу неразобранной части исходной строки
         */
        next(){  
            if(!this.end()){
                this._pos++;
            }
        }
        /**
         * Пропуск пробельных символов
         */
        skip(){ 
            while( this._DEFAULT_WHITESPACE.indexOf(this.current()) >=0 ){
                this.next();
            }
        }
        /**
         * Установка строки для парсинга
         * @param {String} source строка для парсинга
         */
        setSource(source = ''){
            this.source = source;
            this._pos = 0;
        }
        /**
         * Распознает одну из строк-термов, смещает указатель _pos, пропускает все пробелы
         * @param {Array} terms - массив распознаваемых строк-термов
         */
        matchNoExcept(terms){ 
            let pos = this._pos;
            for(var term of terms){ // выбираем отдельный терм из массива термов
                let match = true;
                for(let char of term){ // сравниваем с содержимым исходной строки
                    if( char.localeCompare(this.current()) == 0 ){
                        this.next();
                    } 
                    else {
                        this._pos = pos;
                        match = false;
                        break;
                    }
                }
                // если распознан терминальный символ, далее пропускаем все пробелы в исходной строке
                if(match){ 
                    this.skip();
                    return term;
                }
            }
            return null; // совпадений нет
        }
        /**
         * Проверяет можно ли распознать в исходной строке с текущего положения одну из строк-термов
         * @param {Array} terms - массив распознаваемых строк-термов
         */
        isMatch(terms){ 
            let pos = this._pos;
            let result = this.matchNoExcept(terms);
            this._pos = pos;
            return result !== null;
        }
        /**
         * Распознаёт одну из строк-термов, смещает указатель _pos, пропускает все пробелы
         * @param {Array} terms - массив распознаваемых строк-термов 
         */
        _match(terms){
            let result = this.matchNoExcept(terms);
            if(result === null){
                let message = 'Ожидалась одна из строк: ';
                let first = true;
                for(let term of terms){
                    if(!first) message += ", ";
                    message += "\"" + term + "\"";
                    first = false;
                }
                message += ' в позиции ' + pos;
                throw new SyntaxError(message, pos);
            }
            return result;
        }
        /**
         * Распознаёт одну строку-терм, смещает указатель _pos, пропускает все пробелы
         * @param {String} term - одиночная строка-терм
         */
        _singleMatch(term){ 
            let pos = this._pos;
            try{
                return this.match([term]);
            } catch {
                let message = (term.length == 1) ? 'Ожидался символ': 'Ожидалась строка';
                message += ' \"' + term + '\" в позиции ' + pos;
                throw(new SyntaxError(message, pos));
            }
        }
        /**
         * Распознает одиночный терм или массив термов
         * @param {*} terms - одиночный терм или массив термов
         */
        match(terms){
            if(Array.isArray(terms)){
                return this._match(terms);
            }
            return this._singleMatch(terms);
        }
    }
    
    // Класс парсера уравнения химической реакции
    // Реализованы следующие правила подстановки:
    //  уравнение := молекула , {‘+’ , молекула} , ’=’ , молекула , {’+’ , молекула}
    //  молекула := элемент , { элемент } 
    //  группаАтомов:= ‘(’, элемент , {элемент}, ‘)’ , [индекс]
    //  комплекс:= ‘[’, элемент, {элемент}, ‘]’, [индекс]
    //  элемент:= атом | группаАтомов | комплекс 
    //  атом:= прописнаяБуква,{строчнаяБуква},[индекс]
    //  индекс:=цифра,{’0’|цифра}
    // 
    //  прописнаяБуква:=A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z
    //  строчнаяБуква:=a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z
    //  цифра:=’1’|’2’|’3’|’4’|’5’|’6’|’7’|’8’|’9’
    /**
     * Класс парсера уравнения химической реакции 
     */
    class ChemicalEquationsParser extends BaseParser{
        constructor(source){
            super(source);
        }
        /**
         * Возвращает исходную строку с уравнением реакции
         * @returns {String} исходноя строка с уравнением реакции
         */
        getSource(){
            return this.source;
        }
        /**
         * Установка исходной строки для парсинга
         * @param {String} source строка для парсинга
         */
        setSource(source){
            this.source = source + '';
        }
        // Создание компонентов уравнения реакции
        // варианты options для разных компонентов
        // equation = createEquationComponent( {name:'equation', source: ''} )
        // agent = createEquationComponent( {name:'agent', molecule: moleculeObject, coefficient: ''} )
        // molecule = createEquationComponent( {name:'molecule', atomsGroup: atomsGroupObject, source: ''} )
        // atomsGroup = createEquationComponent( {name:'atomsGroup', atomsArray: [atomObject]} )
        // atom = createEquationComponent( {name:'atom', atomName: '', atomIndex: 1} )
        /**
         * Создание компонентов уравнения реакции
         * @param {Object} options опции для создания нужного компонента химической реакции
         * @returns {Object} уравнение реакции или отдельный компонент уравнения
         */
        createEquationComponent(options){
            /**
             * Класс уравнения реакции
             * @param {String} - строка с уравнением реакции
             */
            class Equation{ 
                constructor(source){
                    this.reagents = []; // реагенты
                    this.products = []; // продукты
                    this.source = source; // строка с уравнением реакции
                }

                /**
                 * Добавить реагент в уравнение реакции
                 * @param {Agent} agent объект "агент" реакции
                 */
                addReagents(agent){ // добавить реагент
                    this.reagents.push(agent);
                    return this;
                }
                /**
                 * Добавить продукт в уравнение реакции
                 * @param {Agent} agent объект "агент" реакции
                 */
                addProducts(agent){ // добавить продукт
                    this.products.push(agent);
                    return this;
                }
                /**
                 * Получить все наименования атомов в реакции
                 * @returns {Array} массив строк с именами атомов
                 */
                getAllAtomsNames(){ // 
                    let atomsNames = []; // наименования всех атомов в данной реакции
                    
                    // реагенты
                    this.reagents.forEach((agent) => {
                        agent.bruttoFormula.forEach((atom) => {
                            atomsNames.push(atom.name);
                        });
                    });
                    // продукты
                    this.products.forEach((agent) => {
                        agent.bruttoFormula.forEach((atom) => {
                            atomsNames.push(atom.name);
                        });
                    });
    
                    return atomsNames.filter((itm, idx) => atomsNames.indexOf(itm) === idx);
                }
                /**
                 * Возвращает матрицу уравнений материального баланса реакции
                 * @returns {Array} двумерный массив чисел, отображает систему уравнений материального баланса
                 */
                getEquationMatrix(){ 
                    // наименования всех атомов, участвующих в реакции                
                    let atomsNames = this.getAllAtomsNames();
    
                    let eqMatrix = []; // матрица уравнений материального баланса
                    let self = this;
                    
                    atomsNames.forEach((atomName)=>{
                        let eq = []; // уравнение материального баланса для atomName
                        
                        // формирование левой части уравнения материального баланса для атома atomName
                        self.reagents.forEach((molecule) => {
                            
                            let atm = molecule.bruttoFormula.find((atom) => {
                                if(atom.name == atomName) return true;
                                return false;
                            });
                            
                            if(atm){ 
                                eq.push(atm.index);
                            } else {
                                eq.push(0);
                            }
    
                        });
                        // формирование правой части уравнения материального баланса для атома atomName
                        self.products.forEach((molecule) => {
                            
                            let atm = molecule.bruttoFormula.find((atom) => {
                                if(atom.name == atomName) return true;
                                return false;
                            });
                            
                            if(atm){ 
                                eq.push(-atm.index);
                            } else {
                                eq.push(0);
                            }
                            
                        });
    
                        eq.push(0); // формируем расширенную матрицу
    
                        // сбор уравнений в матрицу
                        eqMatrix.push(eq);
                    });
       
                    return eqMatrix;
                }
                /**
                 * Расстановка  коэффициентов реакции в уравнение из массива 
                 * @param {Array} ratios массив коэффициентов реакции
                 */
                setRatios(ratios){ // расстановка коэффициентов реакции из массива ratios
                    if(!Array.isArray(ratios) || ratios.length == 0){
                        throw(new Error('Аргументом функции должен быть массив коэффициентов реакции'));
                    }
    
                    let totalReagents = this.reagents.length;
                    let totalProducts = this.products.length;
    
                    if((totalProducts + totalReagents) != ratios.length){
                        throw(new Error('Количество коэффициентов не соответствует количеству реагентов и продуктов реакции'));
                    }
                    
                    let isPositive = !ratios.some((k)=>{ 
                        // возвращает false если все коэффициенты больше нуля, 
                        if(k > 0) return false;
                        return true;
                    });
    
                    if(!isPositive){
                        throw(new Error('Один или более коэффициентов меньше или равен нулю'));
                    }
    
                    ratios.forEach((coeff, i)=>{
    
                        if(i < totalReagents){
                            this.reagents[i].coefficient = '';
    
                            if(coeff > 1){
                                this.reagents[i].coefficient += coeff;
                            }
                        } else {
                            let j = i - totalReagents;
                            this.products[j].coefficient = '';
    
                            if(coeff > 1){
                                this.products[j].coefficient = coeff;
                            }
                            
                        }
                    });
                }
                /**
                 * Возвращает строку уравнения реакции с расставненными коэффициентами 
                 * @returns {String} строка с уравнением реакции
                 */
                getEquationString(){ // 
                    let res = '';
                    this.reagents.forEach((agent, i, re) => {
                        res += agent.coefficient;
                        res += agent.source;
                        if(i < re.length - 1){
                            res += ' + ';
                        }
                    });
                    res += ' = ';
                    this.products.forEach((agent, i, pr) => {
                        res += agent.coefficient;
                        res += agent.source;
                        if(i < pr.length - 1){
                            res += ' + ';
                        }
                    });
                    return res;
                }
            }
            /**
             * Класс обертка для молекул реагентов и продуктов реакции
             */
            class Agent{ // агент реакции (реагент или продукт)
                constructor(molecule){
                    this.molecule = molecule; // молекула агента реакции
                }
            }
            /**
             * Класс молекул
             * @param {AtomsGroup} - группа атомов
             * @param {String} source - исходная строка с молекулой
             */
            class Molecule{  // молекула
                constructor(atomsGroup, source = ''){ 
                    this.bruttoFormula = atomsGroup.bruttoFormula; // [atom] брутто формула в виде массива атомов
                    this.source = source; // исходная строка с молекулой
                    this.coefficient = ''; // коэффициент перед молекулой в уравнении
                }
                /**
                 * Проверка на эквивалентность молекул
                 * @param {Molecule} mol молекула
                 */
                isEqual(mol){
                    if(this.source == mol.source){
                        return true;
                    }
                    return false;
                }
            }
            /**
             * Класс "группа атомов"
             * @param {Array of Atom} atomsArray - массив атомов
             */
            class AtomsGroup{ // группа атомов
                constructor(atomsArray = []){ // принимает массив атомов
                    this.bruttoFormula = atomsArray; // [atom] брутто формула группы атомов в виде массива атомов
                    this._optimize(); // делает атомы в группе уникальными
                }
                /**
                 * Суммирует индексы дубликатов атомов в брутто формуле 
                 * @returns {Array of Atom} массив из "уникальных" атомов
                 */
                _optimize(){  
                    let atoms = this.bruttoFormula;
        
                    atoms.sort((atom1, atom2) => {
                        if(atom1.name == atom2.name) return  0;
                        if(atom1.name > atom2.name)  return  1;
                        if(atom1.name < atom2.name)  return -1;
                    });
        
                    this.bruttoFormula = atoms.reduce((uniqueAtoms, atom) => {
                        let totalUqAtoms = uniqueAtoms.length;
                        let lastIdx = totalUqAtoms -1;
    
                        if(totalUqAtoms != 0 && uniqueAtoms[lastIdx].name == atom.name){
                            uniqueAtoms[lastIdx].index += atom.index;
                        } else {
                            uniqueAtoms.push(atom);
                        }
        
                        return uniqueAtoms;
                    },[]);            
                }
                /**
                 * Добавляет новый атом в группу
                 * @param {Atom} atom - добавляемый атом
                 * @returns {AtomsGroup} - возвращает this 
                 */
                addAtom(atom){ // добавляет новый атом в группу
                    this.bruttoFormula.push(atom);
                    this._optimize();
                    return this;
                }
                /**
                 * Добавить группу атомов
                 * @param {AtomsGroup} atomsGroup группа атомов
                 * @returns {AtomsGroup} возвращает this
                 */
                addGroup(atomsGroup){ 
                    this.bruttoFormula = this.bruttoFormula.concat(atomsGroup.bruttoFormula);
                    this._optimize();
                    return this;
                }
                /**
                 * Добавляет массив атомов
                 * @param {Array of Atom} atoms массив атомов
                 */
                addAtoms(atoms){ 
                    this.bruttoFormula = this.bruttoFormula.concate(atoms);
                    this._optimize();
                    return this;
                }
                /**
                 * Устанавливает групповой индекс для группы атомов
                 * @param {Number} idx групповой индекс
                 */
                addGroupIndex(idx){
                    idx = +idx;
                    let atoms = this.bruttoFormula;
                    if(idx > 0){
                        this.bruttoFormula = atoms.map( (atom)=>{ atom.index *= idx; return atom;});
                    }
                }
            }
            /**
             * Класс атомов
             * @param {String} name - "имя" атома
             * @param {Number} index - индекс атома
             */
            class Atom{ // отельный атом
                constructor(name, index){
                    this.name = name; // символ атома
                    this.index = index > 0 ? +index: 1; // количество атомов
                }
            }
        
            switch(options.name){
                case 'equation': 
                    return new Equation(options.source);
                case 'agent':
                    return new Agent(options.molecule, options.coefficient);
                case 'molecule':
                    return new Molecule(options.atomsGroup, options.source);
                case 'atomsGroup':
                    return new AtomsGroup(options.atomsArray);
                case 'atom':
                    return new Atom(options.atomName, options.atomIndex);
                default:
                    throw new Error('Недопустимое имя компонента реакции');
            }
        }
        // 
        // возвращает число или null, если распознать число не удалось
        /**
         * Разбор индексов
         * [правило грамматики:]  индекс:=цифра,{’0’|цифра}
         * 
         * @returns {Number} разобранный индекс или null, если разобрать не удалось
         */
        indexParsing(){
            
            let num = ['1','2','3','4','5','6','7','8','9'];
            let idx = '';
    
            if(!this.isMatch(num)) return null;
            
            idx += this.match(num);
            
            while(this.isMatch(['0', ...num])){
                idx +=this.match(['0', ...num]);
            }
    
            return +idx;
    
        }
        /**
         * Разбор группы атомов в круглых скобках
         * [правило грамматики:]  группаАтомов:= ‘(’, элемент , {элемент}, ‘)’ , [индекс]
         * 
         * генерирует исключение, в случае ошибки (нет закрывающей скобки)
         * 
         * @returns {AtomsGroup} - возвращает группу атомов (class AtomsGroup) или null, если атомов нет
         */
        atomsGroupParsing(){ // 
    
            let resultAtomsGrp = this.createEquationComponent({name:'atomsGroup', atomsArray: []});
            if(this.isMatch(['('])){
                this.match('(');
                
                let initAtomsGrp = this.elementParsing();
                if(initAtomsGrp === null){
                    throw(new SyntaxError('Ожидался атом, группа атомов или комплекс в позиции ' + this._pos, this._pos));
                } 
    
                resultAtomsGrp.addGroup(initAtomsGrp);
    
                while( (initAtomsGrp = this.elementParsing()) !== null ){
                    resultAtomsGrp.addGroup(initAtomsGrp);
                }
    
                if(!this.isMatch([')'])){
                    throw(new SyntaxError('Ожидалась закрывающая скобка ")" в позиции ' + this._pos, this._pos));
                } 
                this.match(')');
    
                let index = this.indexParsing();
                
                if(index !== null){
                    resultAtomsGrp.addGroupIndex(index);
                }
    
                return resultAtomsGrp;
            }
    
            return null;
        }
        /**
         * Разбор группы атомов в квадратных скобках
         * [правило грамматики:] комплекс:= ‘[’, элемент, {элемент}, ‘]’, [индекс]
         * 
         * генерирует исключение, в случае ошибки (нет закрывающей скобки)
         * 
         * @returns {AtomsGroup} - возвращает группу атомов или null, если атомов нет
         */
        complexParsing(){  
            
            let resultAtomsGrp = this.createEquationComponent({name:'atomsGroup', atomsArray: []});
            if(this.isMatch(['['])){
                this.match('[');
                
                let initAtomsGrp = this.elementParsing();
                if(initAtomsGrp === null){
                    throw(new SyntaxError('Ожидался атом, группа атомов или комплекс в позиции ' + this._pos, this._pos));
                } 
    
                resultAtomsGrp.addGroup(initAtomsGrp);
    
                while( (initAtomsGrp = this.elementParsing()) !== null ){
                    resultAtomsGrp.addGroup(initAtomsGrp);
                }
    
                if(!this.isMatch([']'])){
                    throw(new SyntaxError('Ожидалась закрывающая скобка "]" в позиции ' + this._pos, this._pos));
                }
    
                this.match(']');
                
                let index = this.indexParsing();
                if(index !== null){
                    resultAtomsGrp.addGroupIndex(index);
                }
                
                return resultAtomsGrp;
            }
            return null;
        }
        /**
         * Разбор атомов
         * 
         * реализованные правила грамматики:
         * атом:= прописнаяБуква,{строчнаяБуква},[индекс]
         * прописнаяБуква:=A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z
         * строчнаяБуква:=a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z
         * 
         * @returns {Atom} - возвращает атом или null в случае неудачи
         */
        atomParsing(){ 
    
            let capitalLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
            let smallLetters = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
            let atmName = '';
            let atmIndex = 1;
            
            if(this.isMatch(capitalLetters)) 
                atmName += this.match(capitalLetters);
            else 
                return null;
            
            while(this.isMatch(smallLetters)){
                atmName += this.match(smallLetters);
            }
    
            let atom = this.createEquationComponent({name:'atom', atomName: atmName, atomIndex: 1});
    
            if((atmIndex = this.indexParsing()) !== null ) atom.index = atmIndex; 
    
            return atom; 
           
        }
        /**
         * Разбор элементов рекции (атом, группа атомов, комплекс)
         * [правило грамматики:]  элемент:= атом | группаАтомов | комплекс
         * 
         * @returns {AtomsGroup} - возвращает группу атомов соответствующую разобранному элементу или null   
         * 
         */
        elementParsing(){  
        
            let atom = {};
            let atomsGroup = this.createEquationComponent({name:'atomsGroup', atomsArray: []});
    
            // атом
            if((atom = this.atomParsing()) !== null){
                atomsGroup.addAtom(atom);
                return atomsGroup;
            }
            
            // группаАтомов
            if((atomsGroup = this.atomsGroupParsing()) !== null){
                return atomsGroup;
            }
    
            // комплекс
            if((atomsGroup = this.complexParsing()) !== null){
                return atomsGroup;
            }
    
            return null;
        }
        /**
         * Разбор молекул
         * [правило грамматики:]  молекула := элемент , { элемент } 
         * 
         * @returns {Molecule} возвращает молекулу
         */
        moleculeParsing(){ // 
        
            let atomsGrp = this.createEquationComponent({name:'atomsGroup', atomsArray: []});    
            let startPos = this._pos;
    
            let element = {};
            while( (element = this.elementParsing()) !== null ) {
                atomsGrp.addGroup(element); // собираем группы атомов
            }
            
            let endPos = !this.end() ? this._pos: this.source.length;
            let molSource = this.source.slice(startPos, endPos).trim();
            
            if(atomsGrp.bruttoFormula.length == 0) 
                return null;
    
            return this.createEquationComponent({name: 'molecule', atomsGroup: atomsGrp, source: molSource});
        }
        /**
         * Базовое правило грамматики
         * [правило:]  уравнение := молекула , {‘+’ , молекула} , ’=’ , молекула , {’+’ , молекула}
         * 
         * @returns {Equation} - возвращает уравнение реакции
         */
        equationParsing(){ 
            
            let equation = this.createEquationComponent({name: 'equation', source: this.source});
            let agent = this.moleculeParsing();
            
            let pos = ()=>{return this._pos == -1 ? this.source.length-1: this._pos};
    
            if(agent === null){
                throw(new SyntaxError('Ожидалась молекула реагента в позиции ' + pos(), pos()));
            } 
            equation.addReagents(agent);
            
            while(this.isMatch(['+'])){ // собираем все реагенты
                this.match('+');
                agent = this.moleculeParsing();
                if( agent === null ){
                    throw(new SyntaxError('Ожидалась молекула реагента в позиции ' + pos(), pos())); 
                } 
                equation.addReagents(agent);
            }
    
            
            if(!this.isMatch(['=']) || this.end()){
                throw(new SyntaxError("Ожидался символ \"=\" в позиции " + pos(), pos()));
            } 
            this.match('=');
    
    
            agent = this.moleculeParsing();
            if(agent === null){
                throw(new SyntaxError('Ожидалась молекула продукта реакции в позиции ' + pos(), pos()));
            } 
            equation.addProducts(agent);
    
            while(this.isMatch(['+'])){ // собираем все продукты
                this.match('+')
                agent = this.moleculeParsing();
                if(agent === null){
                    throw(new SyntaxError('Ожидалась молекула продукта реакции в позиции ' + pos(), pos()));
                } 
                equation.addProducts(agent);
            }
    
            return equation;
        }
        /**
         * Запуск парсинга
         * @returns {Equation} уравнение реакции
         */
        execute(){ 
            this.skip();
            let equation = this.equationParsing();
    
            if(this.end()){
                return equation;
            } else {
                throw new SyntaxError("Лишний символ \"" + this.current() + "\" в позиции " + this._pos, this._pos);
            }
        }
    }

    /**
     * Класс обыкновенный дробей
     * @param {Number} num - числитель дроби
     * @param {Number} denom - знаменатель дроби
     * 
     * @returns {OrdinaryFractions} - обыкновенная дробь
     */
    class OrdinaryFractions{
        constructor(num, denom=1){
    
            if(isNaN(+num)){
                throw(new Error('Введенный числитель не является числом'));
            }
            if(isNaN(+denom)){
                throw(new Error('Введенный знаменатель не является числом'));
            }
            if(+denom == 0){
                throw(new Error('Знаменатель должен быть отличен от нуля'));
            }
            
            this.numerator = +num;
    
            if((+denom) < 0){
                this.numerator = -this.numerator;
            } 
            this.denominator = Math.abs(+denom);
    
            if(!Number.isInteger(this.numerator) || !Number.isInteger(this.denominator)){
                throw(new Error('Числитель и знаменатель должны быть целыми числами'));
            }
    
            this.reduce(); // сокращение дроби
        }
        /**
         * Сложение обыкновенных дробей
         * складывает текущую дробь со своим аргументом
         * @param {OrdinaryFractions} frac - дробь-слагаемое
         * @returns {OrdinaryFractions} возвращает this
         */
        add(frac){ // this += frac  
            let num, lcm;
    
            if(Number.isInteger(+frac)){
                num = this.denominator * frac + this.numerator;
                lcm = this.denominator;
            } else if(frac instanceof OrdinaryFractions){
                // lcm - это НОК
                lcm = frac.denominator * this.denominator / this._getGCF(frac.denominator, this.denominator);
                num = (lcm/this.denominator)*this.numerator + (lcm/frac.denominator)*frac.numerator;
            } else {
                throw(new Error('Аргументом функции должно быть целое число или дробь'));
            }
            
            this.numerator = num;
            this.denominator = lcm;
            
            return this.reduce();
        }
        /**
         * Вычитает из текущей дроби дробь-аргумент
         * @param {OrdinaryFractions} frac дробь-вычитаемое
         * @returns {OrdinaryFractions} возвращает this
         */ 
        sub(frac){ // this -= frac
            let num, lcm;
    
            if(Number.isInteger(frac)){
                num = frac*this.denominator - this.numerator;
                lcm = this.denominator;
            } else if(frac instanceof OrdinaryFractions){
                lcm = frac.denominator * this.denominator / this._getGCF(frac.denominator, this.denominator);
                num = (lcm/this.denominator)*this.numerator - (lcm/frac.denominator)*frac.numerator;
            } else {
                throw(new Error('Аргументом функции должно быть целое число или дробь'));
            }
    
            this.numerator = num;
            this.denominator = lcm;
    
            this.reduce();
    
            return this;
        }
        /**
         * Умножает текущую дробь на свой аргумент
         * @param {OrdinaryFractions} frac правильная дробь - множитель
         * @returns {OrdinaryFractions} возвращает this
         */
        mul(frac){ // this *= frac
            let num = 1, denom = 1;
            if(Number.isInteger(frac)){
                num = frac * this.numerator;
                denom = this.denominator;
                
            } else if(frac instanceof OrdinaryFractions) {
                num = this.numerator * frac.numerator;
                denom = this.denominator * frac.denominator;
            } else {
                throw(new Error('Аргументом функции должно быть целое число или дробь'));
            }
            
            this.numerator = num;
            this.denominator = denom;
    
            return this.reduce();
        }
        /**
         * Делит текущую дробь на свой аргумент
         * @param {OrdinaryFractions} frac дробь - делитель
         * @returns {OrdinaryFractions} возвращает this
         */
        div(frac){ // this /= frac
            if(Number.isInteger(frac)){
                if(frac == 0) throw(new Error('Попытка деления на ноль'));
                
                return this.mul(new OrdinaryFractions(1,frac));
            }
            
            if(frac instanceof OrdinaryFractions){
                if(frac.numerator == 0) throw(new Error("Попытка деления на ноль"));
                let inv = new OrdinaryFractions(frac.denominator, frac.numerator);
        
                return this.mul(inv);
            }
            
            throw(new Error('Аргументом функции должно быть целое число или дробь'));
            
        }
        /**
         * Переворачивает дробь
         * @returns {OrdinaryFractions} возвращает this (обратная дробь)
         */
        revers(){ // this = 1/this
            if(this.numerator == 0){
                throw(new Error('Не существунт обратной дроби так как числитель равен нулю'));
            }
    
            let num = this.numerator;
            this.numerator = this.denominator;
            this.denominator = num;
    
            return this.reduce();
        }
        /**
         * Сравнивает текущую дробь со своим аргументом на равентво
         * @param {OrdinaryFractions} frac дробь для сравнения
         * @returns {Boolean} результат сравнения на равенство
         */
        isEqual(frac){ // this == frac
            let save = {num: this.numerator, denom: this.denominator};
    
            try{
                if(Number.isInteger(frac)){
                    let res = (this.sub(new OrdinaryFractions(frac))).numerator == 0;
                    
                    this.numerator = save.num;
                    this.denominator = save.denom;
                    
                    return res;
                }
                let res = this.sub(frac).numerator == 0;
                this.numerator = save.num;
                this.denominator = save.denom;
                
                return res;
    
            } catch(e) {
                throw(new Error('Операция сравнения не может быть выполнена так как произошла ошибка: '+ e.message));
            }
            
        }
        /**
         * "Строго больше"
         * Сравнивает текущую дробь со своим аргументом
         * @param {OrdinaryFractions} frac дробь для сравнения
         * @returns {Boolean} если текущая дробь строго больше аргумента, то возвращает true
         */
        isGreaterThan(frac){ // this>frac
            try{
                let save = {num: this.numerator, denom: this.denominator};
                let res = this.sub(frac).numerator > 0;
                
                this.numerator = save.num;
                this.denominator = save.denom;
    
                return res;
    
            } catch(e) {
                throw(new Error('Операция сравнения не может быть выполнена так как произошла ошибка: '+ e.message));
            }
        }
        /**
         * "Строго меньше"
         * Сравнивает текущую дробь со своим аргументом
         * @param {OrdinaryFractions} frac дробь для сравнения
         * @returns {Boolean} если текущая дробь строго меньше аргумента, то возвращает true
         */
        isLessThan(frac){ // this<frac
            try{
                let num = this.numerator;
                let denom = this.denominator;
                let res = this.sub(frac).numerator < 0;
                
                this.numerator = num;
                this.denominator = denom;
    
                return res;
    
            } catch(e) {
                throw(new Error('Операция сравнения не может быть выполнена так как произошла ошибка: '+ e.message));
            }
        }
        /**
         * "Больше или равно"
         * Сравнивает текущую дробь со своим аргументом
         * @param {OrdinaryFractions} frac  дробь для сравнения
         * @returns {Boolean} если текущая дробь больше или равна аргументу, то возвращает true
         */
        isMoreOrEqual(frac){ // this >= frac
            try{
                let save = {num: this.numerator, denom: this.denominator};
                let res = this.sub(frac).numerator >= 0;
                
                this.numerator = save.num;
                this.denominator = save.denom;            
                
                return res;
    
            } catch(e) {
                throw(new Error('Операция сравнения не может быть выполнена так как произошла ошибка: '+ e.message));
            }
        }
        /**
         * "Меньше или равно"
         * Сравнивает текущую дробь со своим аргументом
         * @param {OrdinaryFractions} frac дробь для сравнения
         * @returns {Boolean} если текущая дробь меньше или равна аргументу, то возвращает true
         */
        isLessOrEqual(frac){ // this <= frac
            try{
                let save = {num: this.numerator, denom: this.denominator};
                let res = this.sub(frac).numerator <= 0;
                
                this.numerator = save.num;
                this.denominator = save.denom;
    
                return res;
    
            } catch(e) {
                throw(new Error('Операция сравнения не может быть выполнена так как произошла ошибка: '+ e.message));
            }
        }
        /**
         * Сокращает текущую дробь
         * @returns {OrdinaryFractions} возвращает this
         */
        reduce(){ // сокращение дроби
            // НОД
            let gcf = this._getGCF(this.numerator, this.denominator);
            this.numerator /= gcf;
            this.denominator /= gcf;
            
            if(this.denominator < 0){
                this.numerator = - this.numerator;
            }
            
            this.denominator = Math.abs(this.denominator);
    
            if(this.numerator == 0){
                this.numerator = Math.abs(this.numerator);
            }
            
            return this;
        }
        /**
         * Получение модуля дроби
         * @returns {OrdinaryFractions} возвращает клон дроби взятый по модулю
         */
        getAbs(){
            return new OrdinaryFractions(Math.abs(this.numerator), this.denominator);
        }
        /**
         * Получение клона дроби
         * @returns {OrdinaryFractions} возвращает клон дроби
         */
        getClone(){
            return (new OrdinaryFractions(1)).mul(this);
        }
        /**
         * Получить наибольший общий делитель
         * @param {Number} a 
         * @param {Number} b 
         * @returns {Number} НОД
         */
        _getGCF(a, b){ // НОД
            a = Math.abs(a);
            b = Math.abs(b);
    
            while(a!=0 && b!=0){
                a>b ? a%=b: b%=a;
            }
            return a+b;
        }
        toString(){
            return this.numerator + '/' + this.denominator;
        }
        valueOf(){
            return this.numerator + '/' + this.denominator;
        }
    }
    /**
     * базовый класс матриц
     * @param {Number | Array} totalRows - количество строк или двумерный массив
     * @param {Number} totalCols - количество строк
     * @returns {BaseMatrix} матрица
     */
    class BaseMatrix{ // 
        constructor(totalRows = 0, totalCols = 0){ // размерность матрицы
            if(Array.isArray(totalRows)){
                this.matrix = [totalRows];
            } else {
                let tRows = +totalRows;
                let tCols = +totalCols;
                
                if(isNaN(tRows) || isNaN(tCols) || !Number.isInteger(tRows) || !Number.isInteger(tCols) || tRows < 0 || tCols < 0){
                    throw(new Error('Размерность матрицы нужно задавать неотрицательным целыми числами'));
                }
        
                this.matrix = this._createMatrix(tRows, tCols);
            }
            
        }
        /**
         * Создание пустой матрицы размером trows x tcols
         * @param {Number} trows количество строк
         * @param {Number} tcols количество столбцов
         * @returns {Array} пустой двумерный массив
         */
        _createMatrix(trows, tcols){ // создание пустой матрицы размерности trows x tcols
            let arr = new Array(trows);
           
            for(let i = 0; i < arr.length; i++){
                arr[i] = new Array(tcols);
            }
            
            return arr;
        }
        /**
         * Добавление строки в матрицу
         * @param {Array} row - массив-строка матрицы
         * @returns {BaseMatrix} возвращает this
         */
        appendRow(row){ // добавить строку row
            if(!Array.isArray(row)){
                throw(new Error('Аргументом функции должна быть строка матрицы'));
            }
            
            if(row.length != this.getColsCnt() && this.getColsCnt() != 0){
                throw(new Error('Размер строки не соответствует количеству столбцов в матрице'));
            }
            
            this.matrix.push(row);
            
            return this;
        }
        /**
         * Удаляет строку с индексом index
         * @param {Number} index индекс удаляемой строки
         * @returns {BaseMatrix} возврящает this
         */
        delRow(index){ // удалить строку с индексом index
            if(!this._isValidRowIndex(index)){
                throw(new Error('Указано недопустимое значение индекса строки'));
            }
            
            this.matrix.splice(index,1);
            
            return this;
        }
        /**
         * Меняет строки местами
         * @param {Number} index1 индекс первой строки
         * @param {Number} index2 индекс второй строки
         * @returns {BaseMatrix } возврящает this
         */
        swapRows(index1, index2){ // поменять строки местми
            if(!this._isValidRowIndex(index1) || !this._isValidRowIndex(index2)){
                throw(new Error('Указаны недопустимые индексы'));
            }
            let row1 = this.matrix[index1];
            this.matrix[index1] = this.matrix[index2];
            this.matrix[index2] = row1;
            
            return this;
        }
        /**
         * Получить количество колонок в матрице
         * @returns {Number} количество колоной в матрице
         */
        getColsCnt(){ // количество колонок в матрице
            if(this.getRowsCnt() == 0) return 0;
            return this.matrix[0].length;
        }
        /**
         * Получить количество строк в матрице
         * @returns {Number} количество строк вматрице
         */
        getRowsCnt(){ // количество строк в матрице
            return this.matrix.length;
        }
        /**
         * Проверка индекса строки на допустимость
         * @param {Number} idx индекс строки
         * @returns {Boolean} true если это допустимый индекс строки
         */
        _isValidRowIndex(idx){ // проверка индекса строки на допустимость
            if(!Number.isInteger(idx) || idx >= this.getRowsCnt() || idx < 0){
                return false;
            }
                return true;
        }
        /**
         * Проверка индекса колонки на допустимость
         * @param {Number} idx  индекс колонки
         * @returns {Boolean} true, если это допустимый индекс колонки
         */
        _isValidColIndex(idx){ // проверка индекса колонки на допустимость
            if(!Number.isInteger(idx) || idx >= this.getColsCnt() || idx < 0){
                return false;
            }
                return true;
        }
    }
    /**
     * Класс матриц правильных дробей
     * @param {Array | Number} totalRows двумерный массив чисел или правильных дробей или количество строк
     * @param {Number} totalCols количество колонок
     * @returns {OrdinaryFractionsMatrix} матрица правильных дробей
     */
    class OrdinaryFractionsMatrix extends BaseMatrix{ //матрицы правильных дробей
        constructor(totalRows, totalCols){
            super(totalRows, totalCols);
    
            if(Array.isArray(totalRows)){
                for(let i in this.matrix[0]){ // при инициализации массивом преобразуем его в массив обыкновенных дробей
                    
                    if(Number.isInteger(this.matrix[0][i])){
                        this.matrix[0][i] = new OrdinaryFractions(this.matrix[0][i]);
                    }
                    
                    if(!(this.matrix[0][i] instanceof OrdinaryFractions)){
                        throw(new Error('Элементами строки матрицы должны быть обыкновенные дроби'));
                    }
                }
            }
        }
        /**
         * Добавляет строку в матрицу
         * @param {Array} row массив-строка матрицы
         * @returns {OrdinaryFractionsMatrix} возвращает this
         */
        appendRow(row){ // добавить строку в матрицу
    
            super.appendRow(row);
            let lastIdx = this.getRowsCnt() - 1;
            
            for(let i in this.matrix[lastIdx]){
                let el = this.matrix[lastIdx][i];
    
                if(Number.isInteger(el)){
                    this.matrix[lastIdx][i] = new OrdinaryFractions(el);
                    continue;
                }
    
                if(!(el instanceof OrdinaryFractions)){
                    this.delRow(lastIdx);
                    throw(new Error('Недопустимые значения элементов в строке матрицы'));
                }
            }
            return this;
        }
        /**
         * Клонирование строки матрицы
         * @param {Number} rowIdx индекс клонируемой строки
         * @returns {Array} массив-строка матрицы
         */
        getCloneRow(rowIdx){ // получит клон строки с идексом rowIdx
            if(!this._isValidRowIndex(rowIdx)){
                throw(new Error('Недопустимое значение индекса строки'));
            }
    
            let cloneRow = [];
            
            for(let i = 0; i < this.matrix[rowIdx].length; i++){
                let frac = this.matrix[rowIdx][i];
                let cloneFrac = (new OrdinaryFractions(1)).mul(frac);
    
                cloneRow.push(cloneFrac);
            }
    
            return cloneRow;
        }
        /**
         * Линейная комбинация строк матрицы
         * умножение строки на число и сложение с другой строкой
         * 
         * row1Idx = number * row2Idx + row1Idx
         * @param {Number} row1Idx индекс первой строки
         * @param {Number} row2Idx индекс второй строки
         * @param {Number} number коэффициент
         */
        calcLinComb(row1Idx, row2Idx, number){ 
            if(!Number.isInteger(row1Idx) || !Number.isInteger(row2Idx) || row1Idx < 0 || row2Idx < 0 ){
                throw(new Error('Некорректные индексы: индексы должны быть неотрицательными целыми числами'));
            }
            if(!Number.isInteger(number) && !(number instanceof OrdinaryFractions)){
                throw(new Error('Некорректный множитель: умножать строку можно на целое число или дробь'));
            }
            
            let row = [];
    
            for(let i in this.matrix[row2Idx]){
                
                let lnFrac = this.matrix[row2Idx][i];
                let cpFrac = new OrdinaryFractions(lnFrac.numerator, lnFrac.denominator);
                
                cpFrac.mul(number);
                this.matrix[row1Idx][i].add(cpFrac);
    
            }
    
            return this;
        }

        /**
         * Поиск первого ненулевого элемента в строке
         * @param {Number} rowIdx индекс строки
         * @returns {Number} индекс первого ненулевого элемента в строке или -1 если все элементы строки равны 0
         */
        getNotZeroElementIdx(rowIdx){ 
            if(!this._isValidRowIndex(rowIdx)){
                throw(new Error('Недопустимое значение индекса'));
            }
    
            let row = this.matrix[rowIdx];
    
            for(let i in row){
                if(!row[i].isEqual(0)){
                    return +i;
                }
            }
    
            return -1;
    
        }
    
        /**
         * Заменяет строку с индексом startRowIdx на нижелещую строку, 
         * у которой эемент с индексом colIdx отличен от нуля
         * @param {Number} startRowIdx индекс строки с которой начинается поск
         * @param {Number} colIdx индекс колонки с ожидаемым не нулевым элементом
         * @returns {OrdinaryFractionsMatrix} возвращает this
         */
        swapRowIfZero(startRowIdx, colIdx){ 
            if(!this._isValidRowIndex(startRowIdx) || !this._isValidColIndex(colIdx)){
                throw(new Error('Указано недопустимое значение индекса'));
            }
            
            for(let rowIdx = startRowIdx+1; rowIdx < this.getRowsCnt(); rowIdx++){
                
                if(this.getNotZeroElementIdx(rowIdx) == colIdx){
                    this.swapRows(startRowIdx, rowIdx);
                    return this;
                }
            }

            return this;
        }
        /**
         * Приведение матрицы к треугольному виду
         * (алгоритм Бареса)
         * @returns {OrdinaryFractionsMatrix} возвращает this
         */
        setTriangularView(){ 
            // формула для нахождения элементов матрицы        
            // a[i][j] = (a[r][c]*a[i][j]-a[i][c]*a[r][j])/p
            
            if(this.getRowsCnt() == 0 || this.getColsCnt() == 0){
                return this; // пустая матрица
            }

            // опорный элемент для предыдущего шага алгоритма
            let p = new OrdinaryFractions(1);
    
            for(let r = 0; r < this.getRowsCnt(); r++){ // проход по опорным строкам, где r индекс опорной строки
                // r - индекс опорной строки, c - индекс опорного столбца
                let c = r; 
    
                if(this.matrix[r][c].isEqual(0)){
                    // если текущий опорный элемент равен нулю
                    // ищет не нулевой опорный элемент в нижеследующих строках
                    this.swapRowIfZero(r,c);
                    // если все нижеследующие строки пусты
                    if(this.getNotZeroElementIdx(r) == -1) break;

                    c = this.getNotZeroElementIdx(r); // колонка с опроным элементом
                }
                
                for(let i = 0; i< this.getRowsCnt(); i++){  // проход по всем строкам исключая опорную строку
                    if(i==r) {
                        continue;
                    }
    
                    let clnRow = this.getCloneRow(i); // клон текущей строки для вычислений
    
                    for(let j = 0; j < this.getColsCnt(); j++){ // проход по всем колонкам текущей строки
                        
                        // для хранения a[i][c]*a[r][j]
                        let subtrahend = new OrdinaryFractions(1);
    
                        // a[i][c]*a[r][j]
                        subtrahend.mul(this.matrix[r][j]).mul(clnRow[c]);
                        
                        // a[i][j] = (a[r][c]*a[i][j]-a[i][c]*a[r][j])/p
                        this.matrix[i][j].mul(this.matrix[r][c]).sub(subtrahend).div(p);

                    }
                }

                // сохранение опорного элемента для следующего шага
                p = this.matrix[r][c].getClone();

            }

            return this;
        }
        /**
         * Приведение матрицы к диагональному виду
         * @returns {OrdinaryFractionsMatrix} возвращает this
         */
        setDiagonaleView(){ // обратный ход по алгоритму Гаусса
            if(this.getRowsCnt()<=1){
                return this;
            }
            
            // приведение матрицы к треугольному виду
            this.setTriangularView();
    
            // индекс последней непустой строки матрицы
            let lastRowIdx = this._getNotEmptyRowIndex();
    
            for(let i = lastRowIdx; i >= 1; i--){
                let referIdx = this.getNotZeroElementIdx(i);
                
                if(referIdx==-1) continue;
    
                if(i <= this.getRowsCnt() - 1){ 
    
                    for(let j = i-1; j>=0; j--){ // проход по всем строкам выше, чем i
                        
                        // коэффициент для для вычисления линейной комбинации
                        // со всеми строками, выше текущей i строки
                        let k = (new OrdinaryFractions(1)).mul(this.matrix[i][referIdx]);    
                        (k.revers()).mul(this.matrix[j][referIdx]).mul(-1);
    
                        this.calcLinComb(j, i, k); // row[j] = row[i]*k + row[j]
                    }
                }
            }
    
            return this;
        }
        /**
         * Приводит матрицу к единичному виду 
         * @returns {OrdinaryFractionsMatrix} возвращает this
         */
        setUnitMatrixView(){ 
            this.setDiagonaleView(); // привести матрицу к диагональному виду
            
            // построчный проход матрицы сверху вниз
            for(let i = 0; i < this.getRowsCnt(); i++){
                let fracIdx = this.getNotZeroElementIdx(i);
                if(fracIdx == -1)  break; 
                
                let k = this.matrix[i][fracIdx].getClone();
                // делит каждый элемент строки на "диагональный" элемент
                for(let j = 0; j < this.getColsCnt(); j++){
                    this.matrix[i][j].div(k);
                }
            }
    
            return this;
        }
        /**
         * Проверяет на равенство нулю все элементы строки
         * @param {Number} rowIdx индекс строки
         * @returns {Boolean} true, если все элементы строки равны нулю
         */
        _isEmptyRow(rowIdx){ // проверка на "нулевую" строку, true - если это "пустая" строка 
            if(!this._isValidRowIndex(rowIdx)){
                throw(new Error('Указано недопустимое значение индекса'));
            }
            
            for(let i in this.matrix[rowIdx]){
                if(!this.matrix[rowIdx][i].isEqual(0)){
                    return false;
                }
            }
            
            return true;
        }
        /**
         * Получить индекс первой "непустой" строки или -1, если это нулевая матрица
         * перебор начиная с нижней строки матрицы
         * @returns {Number} индекс первой "непустой" строки снизу
         */
        _getNotEmptyRowIndex(){ // перебор с конца матрицы
            for(let i = this.getRowsCnt()-1; i >= 0; i--){
                if(!this._isEmptyRow(i)) return i;
            }
            return -1;
        }
        /**
         * Получить количество базисных переменных в матрице
         * @returns {Number} количество базисных переменных
         */
        _getBasicVarCnt(){  
            let cnt = 0; // количество базисных переменных в матрице
            let i = 0, j = 0;
    
            while(i < this.getRowsCnt() && j < this.getColsCnt()){
                if(this.matrix[i][j].isEqual(0)) break;
                i++; 
                j++;
                cnt++;
            }
    
            return cnt;
        }
        // 
        /**
         * Приведение к целочисленному виду решения
         * @param {Array of OrdinaryFractions} arr массив c решением системы уравнений
         * @returns {Array of Number} массив с решением в виде целых чисел 
         */
        _toInteger(arr){ // возвращает массив результатов
            if(!Array.isArray(arr) || (arr.length == 0) || !(arr[0] instanceof OrdinaryFractions) ){
                throw(new Error('Аргументом функции должен быть не пустой массив обыкновенных дробей'));
            }
    
            let gcf = arr[0]._getGCF;
            let hcf = ((a ,b) => { return Math.abs(a*b) / gcf(a,b); });
    
            let resHCF = 1;
            let result = [];
    
            for(let i in arr){
                resHCF = hcf(arr[+i].denominator, resHCF);
            }
            
            for(let i in arr){
                result.push(arr[+i].mul(resHCF).numerator);
            }
            return result
        }
        /**
         * Получить результат решения в виде целых чилел
         * @returns {Array of Number} массив с решение (с коэффициентами)
         */
        getSolution(){ 
            let sol = []; // массив для результатов
    
            this.setUnitMatrixView(); // привести матрицу к "единичному" виду

            let cnt = this._getBasicVarCnt(); // количество базисных переменных в матрице
    
            // количество незавизимых переменных больше или равно двум 
            if((this.getColsCnt() - cnt) >= 3){ 
                throw(new BalanserError('Ошибка при попытке расстановки коэффициентов. Проверьте правильность исходных данных'));
            }
    
            if(this.getColsCnt()-1 == cnt){ // в ответе единичная матрица
                throw(new BalanserError('Все коэффициенты равны нулю'));
            }
    
            for(let j = 0; j < cnt; j++){
                // записываем решение из предпоследнего столбца
                sol.push(this.matrix[j][this.getColsCnt()-2].getClone().getAbs());
            }
            sol.push(new OrdinaryFractions(1)); // присваеваем единицу независимой переменной
            
           let toInt = this._toInteger(sol);
           
            if(toInt.some((k) =>{return (k <= 0);} )){
                throw(new BalanserError('Один или более коэффициентов меньше или равен нулю'));
            }

            return toInt;
        }
        /**
         * Получить строковое представление матрицы
         * @returns {Array of String} массив со строковым представление обыкновенных дробей
         */
        getStringRepresentation(){
            let m = [];
            for(let i in this.matrix){
                let row = [];
                for(let j in this.matrix[i]){
                    row.push(this.matrix[i][j].toString());
                }
                m.push(row);
            }
            return m;
        }
    }

    class SyntaxError extends Error{
        constructor(mes, pos){
            super(mes);
            this.name = 'SyntaxError';
            this.pos = pos; 
        }
    }

    class BalanserError extends Error{
        constructor(mes){
            super(mes);
            this.name = 'BalanserError' ;
        }
    }
    
    /**
     * Инициализирует матрицу двумерным массивом целых чисел или правильных дробей
     * @param {Array of Array} matrix двумерный массив целых чисел или правильных дробей
     * @returns {OrdinaryFractionsMatrix} сформированная матрица
     */
    function createFractionsMatrix(matrix){ // двумерный массив чисел или правильных дробей
    
        if( matrix === undefined        || 
            !Array.isArray(matrix)      || 
            matrix.length == 0          || 
            !Array.isArray(matrix[0]))
        {
            return new OrdinaryFractionsMatrix();
        }
    
        let n = matrix.length;
        let fracMatrix = new OrdinaryFractionsMatrix();
    
        try{
            for(let i = 0; i < n; i++){
                fracMatrix.appendRow(matrix[i]);
            }
        } catch(e) {
            throw(new Error('При формировании матрицы произошла ошибка: ' + e.message));
        }
        
        return fracMatrix
    }

    
    //  Экспор функционала парсера через возвращение объекта 

    return {
        source: '',
        setSource: function(src){
            
            this.source = src;
        },
        getSource: function(){
            
            return this.source;
        },
        execute: function(){
            
            // создание парсера уравнения реакции и его инициализация
            let eqParser = new ChemicalEquationsParser(this.source);
            // создание уравнения реакции, как результат работы парсера
            let eq = eqParser.execute();
            // создание матрицы материального баланса для уравнения eq
            let eqMatrix = createFractionsMatrix(eq.getEquationMatrix());
            // получение решения матрицы материального баланса в виде массива коэффициентов
            let res = eqMatrix.getSolution();
            // установка полученных коэффициентов в исходное уравнение реакции
            eq.setRatios(res);
            
            // возвращает строку с уравнением реакции и расставленными коэффициентами
            return eq.getEquationString();
        }
    };

})();

/**
 * Выполняет парсинг введенных в форму ввода уравнений
 * @param {Object} parser - объект-парсер
 * @param {String} boxClass - имя класса контейнера формы ввода
 * @param {String} buttonClass - имя класса кнопки
 * @param {String} entryFieldClass - имя класса поля ввода
 * @param {String} messageClass - имя класса контейнера для вывода сообщений
 */
class ParserManager{
    constructor(parser, boxClass = '', buttonClass = '', entryFieldClass= '', messageClass = ''){
        this.parser = parser;
        this.boxClass = boxClass;
        this.buttonClass= buttonClass;
        this.entryFieldClass = entryFieldClass; 
        this.messageClass = messageClass;
        
        this.setGoHandler();

    }
    /**
     * Установка обработчика событий
     */
    setGoHandler(){
        
        this.box = document.querySelector('.' + this.boxClass);
        this.goButton = this.box.querySelector('.' + this.buttonClass);
        this.field = this.box.querySelector('.' + this.entryFieldClass);
        this.messages = this.box.querySelector('.' + this.messageClass);
        
        let self = this;

        if( this.box === null       || 
            this.goButton === null  || 
            this.field === null     || 
            this.messages === null ) 
        {
                throw(new Error('Не найдены необходимые HTML элементы'));
        }

        this.goButton.addEventListener('click', function(ev){
            let res = self.go();
            self.show(res);
        });
    }
    /**
     * Выполннить парсинг и получить результат
     */
    go(){
        let source = this.field.value;
        this.parser.setSource(source);
        this.messages.innerHTML = '';
        try{
            return parser.execute();
        } catch(e) {
            if(e.name == 'SyntaxError'){
                this.messages.innerHTML = e.message;
            } else if(e.name == 'BalanserError'){
                this.messages.innerHTML = e.message;
            } else {
                
                throw(e);
            }
        }
    }
    /**
     * Показать результат вычислений
     * @param {String} res строка с результатами расстановки коэффициентов рекции
     */
    show(res){
        if(res!==undefined){
            this.messages.innerHTML = '';
            this.messages.innerHTML = res;
        }
        
    }
    
}


let pars = new ParserManager(parser, 'balancerBox', 'balancerBox__button', 'balancerBox__input', 'balancerBox__result-text');

